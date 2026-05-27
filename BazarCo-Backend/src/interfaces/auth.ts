export interface AuthSignupBody {
  email: string;
  password: string;
  name?: string;
}

export interface AuthLoginBody {
  email: string;
  password: string;
}

export interface AuthForgotPasswordBody {
  email: string;
}

export interface AuthResetPasswordBody {
  token: string;
  password: string;
}

export interface JwtPayload {
  userId: string;
  email: string;
  tokenVersion?: number;
}

export interface AdminJwtPayload {
  adminId: string;
  email: string;
  username: string;
  role: string;
  scope: "admin";
  tokenVersion?: number;
}

export function isAdminJwtPayload(payload: JwtPayload | AdminJwtPayload): payload is AdminJwtPayload {
  return (payload as AdminJwtPayload).scope === "admin";
}
