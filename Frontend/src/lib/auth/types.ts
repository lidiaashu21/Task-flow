export interface PublicUser {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  emailVerified: boolean;
  createdAt: string;
}

export interface AuthSession {
  user: PublicUser;
  accessToken: string;
}
