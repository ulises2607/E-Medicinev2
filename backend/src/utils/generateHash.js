import bcrypt from "bcrypt";

async function createHash() {
  const password = "password123";
  const saltRounds = 10;
  try {
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    console.log(`Password: ${password}`);
    console.log(`Hashed Password: ${hashedPassword}`);
  } catch (error) {
    console.error("Error hashing password:", error);
  }
}

createHash();
