import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import connectDB from "../src/config/db.js";
import Admin from "../src/models/Admin.js";

dotenv.config();

const ADMIN = {
  name: "admin",
  email: "admin@evcharge.com",
  password: "admin@123",
};

const createAdmin = async () => {
  await connectDB();

  const existingAdmin = await Admin.findOne({ email: ADMIN.email });

  if (existingAdmin) {
    console.log("Admin already exists");
    process.exit(0);
  }

  const hashedPassword = await bcrypt.hash(ADMIN.password, 10);

  await Admin.create({
    name: ADMIN.name,
    email: ADMIN.email,
    password: hashedPassword,
  });

  console.log("Admin created successfully");
  console.log(`Email: ${ADMIN.email}`);
  process.exit(0);
};

createAdmin().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
