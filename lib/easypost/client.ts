import EasyPost from "@easypost/api";

if (!process.env.EASYPOST_API_KEY) {
  throw new Error("EASYPOST_API_KEY is not set in environment variables");
}

const client = new EasyPost(process.env.EASYPOST_API_KEY);

export default client;