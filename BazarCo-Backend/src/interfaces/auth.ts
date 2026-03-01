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
}
