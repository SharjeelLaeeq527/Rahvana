import EasyPost from "@easypost/api";

let _client: EasyPost | null = null;

const client = new Proxy({} as any, {
  get(target, prop) {
    if (!_client) {
      if (!process.env.EASYPOST_API_KEY) {
        throw new Error("EASYPOST_API_KEY is not set in environment variables");
      }
      _client = new EasyPost(process.env.EASYPOST_API_KEY);
    }
    return (_client as any)[prop];
  }
});

export default client;
