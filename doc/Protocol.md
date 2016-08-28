# Protocol

## Networking

- When the power switch is in the "on" position, the machine broadcast a WiFi network
  - SSID: `RocketEspresso`
  - Password: `RocketR60V`
- Connect your laptop or phone to this network to control the machine
  - While connected, you won't be able to access the internet
- The machine is the gateway, with address `192.168.1.1`
- The machine assigns DHCP addresses in `192.168.1.1/24`
- The machine's network is somewhat unreliable - connecting to WiFi or getting an address via DHCP can be flaky
- The machine accepts connections on `TCP` port `1774`

**Issues:**

- If you repeatedly connect and then drop your connection without closing the socket via a `FIN` packet, eventually
  the machine will get into a state where it ceases to respond to any new commands.  The only way to recover from
  this condition is to either wait (TODO: how long? 10-15 minutes ish IIRC) or power cycle the machine.


## Protocol Details

*Formatting Note:*

Lines starting with `->` show messages sent from the client to the machine, and `<-` indicates
messages received from the machine.  Lines starting with `#` are comments describing what is happening.
The spaces are not included in the message.  For example, in this exchange:

```
#connected to 192.168.1.1:1774
<- *HELLO*
-> r00000073FC
```

The machine first sent the message `*HELLO*` (no spaces, a.k.a. the bytes `[0x2a, 0x48, 0x45, 0x4c, 0x4c, 0x4f, 0x2a]`)
to the client.  Next, the client sent the message `r00000073FC` (also no spaces, a.k.a. the bytes
`[0x72, 0x30, 0x30, 0x30, 0x30, 0x30, 0x30, 0x37, 0x33, 0x46, 0x43]`) back to the server.

**Call and Response:**

Aside from the initial greeting (see below), the machine waits for the client to issue a command, and then returns
a response to that command.  Most of the time the response will come in one chunk but sometimes you will need to wait
for and reassemble multiple chunks.  There are a number of ways you can mess up your connection, which usually leads
to a state where the machine will stop responding to commands until you disconnect and reconnect:

### Machine Model

Interacting with the machine consist of making requests to read values out of certain memory addresses, or to write
values or chunks of values back into certain memory addresses.  The addresses used in the protocol are 16-bit addresses,
although it's unclear if these represent the actual machine's memory or just a virtual mapping exposed by the
machine to the network protocol.

The Android app reads a large amount of config state when you first connect to the machine, and then when you modify any settings
and leave the settings screen, it writes all of the config back to the machine.  This means that if a setting is changed
by somebody else between when you connect the Android app to the machine and when you write your settings changes,
your app's version of the settings will win and overwrite the other changes.

Fortunately, the protocol allows writing any contiguous memory range, even a single byte, so it's fairly easy to target
and alter only specific settings without having to first read the other, surrounding state.

### Message Format

All messages follow a standard format (with a few caveats, like the Greeting, or the Write Confirmation; see below).

Let's look at a sample message (in this case, a message received from the machine) and then break it apart:

```
rB0000008697D000E360300425D
```

This message breaks down into the following segments:

| Segment            | Name     | Description  |
|--------------------|----------|--------------|
| `r`                | command  | Can be either `r` (byte `0x72`) for reading, or `w` (byte `0x77`) for writing |
| `B000`             | offset   | 16-bit unsigned integer, encoded big-endian as four uppercase hex characters (`0xB000` is decimal `45056`) |
| `0008`             | length   | 16-bit unsigned integer, encoded big-endian as four uppercase hex characters (`0x0008` is decimal `8`) |
| `697D000E36030042` | data     | Sequence of unsigned 8-bit numbers, each encoded as a hex couplet; in this example, `[105, 125, 0, 14, 54, 3, 0, 66]` |
| `5D`               | checksum | Sum of all previous raw byte values, modulo 256 and hex encoded; see "Checksum Calculation" |

Together, we will call `rB0000008697D000E36030042` our raw message, and `5D` our checksum.

#### Checksum Calculation

The checksum is simply the sum of the value of bytes in the raw message, modulo 256 and encoded as a hex couplet.

Let's take our example raw message `rB0000008697D000E36030042` from above.  In Node, we can calculate the checksum
like so:

```ts
let buf = new Buffer('rB0000008697D000E36030042');
let sum = buf.reduce((partialSum, byte) => partialSum + byte);
let result = sum.toString(16).toUpperCase();
console.log(result); //5D
```

#### Reading Responses

The machine will not always send each response all in one chunk, so you may have to piece together multiple packets
of data to get the final response. Fortunately each message tells you how long it will be, so for example
if you receive a chunk `r00000010` you know to expect 0x10 bytes in the data chunk (which means 32 hex chars), and
a two-char checksum at the end.  This makes reassembling messages easy with a simple state machine.

*Note:* Each message type is different, so see details below for what you should expect in the "data" chunk.


## Message Types

<!-- TODO: document message types -->
