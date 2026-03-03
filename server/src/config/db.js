import mongoose from "mongoose";
import dns from "dns";

const buildMongoUri = () => {
  let mongoUri = process.env.MONGODB_URI;
  const dbName = (process.env.MONGODB_DB_NAME || "social_media").trim();

  if (!mongoUri) throw new Error("MONGODB_URI environment variable is missing");

  mongoUri = mongoUri.trim().replace(/\/+$/, "");

  if (mongoUri.startsWith("mongodb+srv://")) {
    // Fallback DNS servers help when local resolver has SRV lookup issues.
    dns.setServers(["8.8.8.8", "8.8.4.4"]);
  }

  if (mongoUri.includes("?")) {
    const [base, params] = mongoUri.split("?");
    return `${base.replace(/\/+$/, "")}/${dbName}?${params}`;
  }

  return `${mongoUri}/${dbName}?retryWrites=true&w=majority`;
};

export const connectDB = async () => {
  try {
    mongoose.connection.on("connected", () => {
      console.log("MongoDB connected successfully");
    });

    mongoose.connection.on("error", (err) => {
      console.error("MongoDB connection error:", err.message);
    });

    const finalUri = buildMongoUri();

    await mongoose.connect(finalUri, {
      serverSelectionTimeoutMS: 15000,
      socketTimeoutMS: 45000
    });
  } catch (error) {
    console.error("Error connecting to MongoDB:", error.message);

    if (error.code === "ECONNREFUSED" || String(error.message).includes("querySrv")) {
      console.error("DNS SRV resolution issue detected. Use Atlas standard connection string if needed.");
    }

    process.exit(1);
  }
};
