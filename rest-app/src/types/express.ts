export {};

declare global {
  namespace Express {
    interface Request {
      session: {
        subject: string;
        isAdmin: boolean;
      };
    }
  }
}
