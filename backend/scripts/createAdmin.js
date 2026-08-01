const readline = require("readline");
const bcrypt = require("bcrypt");
require("../src/config/env");
const prisma = require("../src/config/prisma");

const CTRL_C_CODE = 0x03;
const BACKSPACE_CODE = 0x7f;

function createPrompter(rl) {
  const queue = [];
  const waiters = [];

  rl.on("line", (line) => {
    if (waiters.length) {
      waiters.shift()(line);
    } else {
      queue.push(line);
    }
  });

  return function ask(question) {
    process.stdout.write(question);
    if (queue.length) {
      return Promise.resolve(queue.shift());
    }
    return new Promise((resolve) => waiters.push(resolve));
  };
}

function askHidden(rl, ask, question) {
  if (!process.stdin.isTTY) {
    return ask(question);
  }

  rl.pause();

  return new Promise((resolve) => {
    const stdin = process.stdin;
    let input = "";
    process.stdout.write(question);
    stdin.setRawMode(true);
    stdin.resume();

    const onData = (buf) => {
      for (const byte of buf) {
        if (byte === 0x0a || byte === 0x0d) {
          stdin.setRawMode(false);
          stdin.removeListener("data", onData);
          process.stdout.write("\n");
          rl.resume();
          resolve(input);
          return;
        }
        if (byte === CTRL_C_CODE) {
          process.exit(1);
        }
        if (byte === BACKSPACE_CODE) {
          input = input.slice(0, -1);
        } else {
          input += String.fromCharCode(byte);
        }
      }
    };

    stdin.on("data", onData);
  });
}

async function main() {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: process.stdin.isTTY });
  const ask = createPrompter(rl);

  try {
    const email = (await ask("Email do admin: ")).trim();
    if (!email) {
      throw new Error("Email e obrigatorio");
    }

    const senha = await askHidden(rl, ask, "Senha do admin (min. 8 caracteres): ");
    if (!senha || senha.length < 8) {
      throw new Error("Senha deve ter pelo menos 8 caracteres");
    }

    const senhaHash = await bcrypt.hash(senha, 12);

    const admin = await prisma.adminUsuario.upsert({
      where: { email },
      update: { senhaHash },
      create: { email, senhaHash },
    });

    console.log(`Admin "${admin.email}" salvo com sucesso (id ${admin.id}).`);
  } finally {
    rl.close();
  }
}

main()
  .catch((err) => {
    console.error("Erro:", err.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
