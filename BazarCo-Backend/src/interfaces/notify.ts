export interface NotifyEmailBody {
  email: string;
}

export type NotifySignUpResult =
  | { status: "created" }
  | { status: "already_notified" };
