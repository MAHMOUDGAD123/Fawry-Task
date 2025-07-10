type Colors =
  | "reset"
  | "bright"
  | "fg-black"
  | "fg-red"
  | "fg-green"
  | "fg-yellow"
  | "fg-blue"
  | "fg-magenta"
  | "fg-cyan"
  | "fg-white"
  | "fg-gray"
  | "fg-crimson"
  | "bg-black"
  | "bg-red"
  | "bg-green"
  | "bg-yellow"
  | "bg-blue"
  | "bg-magenta"
  | "bg-cyan"
  | "bg-white"
  | "bg-gray"
  | "bg-crimson";

const COLORS: Record<Colors, `\x1b[${number}m`> = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  "fg-black": "\x1b[30m",
  "fg-red": "\x1b[31m",
  "fg-green": "\x1b[32m",
  "fg-yellow": "\x1b[33m",
  "fg-blue": "\x1b[34m",
  "fg-magenta": "\x1b[35m",
  "fg-cyan": "\x1b[36m",
  "fg-white": "\x1b[37m",
  "fg-gray": "\x1b[90m",
  "fg-crimson": "\x1b[38m",
  "bg-black": "\x1b[40m",
  "bg-red": "\x1b[41m",
  "bg-green": "\x1b[42m",
  "bg-yellow": "\x1b[43m",
  "bg-blue": "\x1b[44m",
  "bg-magenta": "\x1b[45m",
  "bg-cyan": "\x1b[46m",
  "bg-white": "\x1b[47m",
  "bg-gray": "\x1b[100m",
  "bg-crimson": "\x1b[48m",
};

/** A custom logger */
export function logger(
  logArray: [text: string, col: Colors, bright?: boolean][],
  time: boolean = true,
) {
  let msg = "";

  logArray.forEach(([text, col, bright], i) => {
    msg += `${bright ? COLORS.bright : ""}${COLORS[col]}${text}${COLORS.reset}`;

    
    // After first background item, clear to end of line and reset cursor
    if (i === 0 && col.startsWith("bg-")) {
      msg += "\x1b[K\x1b[G"; // Clear to end of line + move to column 0
      // Calculate cursor position after our text
      const textLength = text.length;
      msg += `\x1b[${textLength}C`; // Move cursor forward to continue
    }

    // Add time
    if (time && i === 0) {
      msg += `${COLORS["fg-gray"]}(${new Date().toLocaleTimeString()})${COLORS.reset} `;
    }
  });

  console.log(msg);
}
