export interface PublicProfile {
  id: string;
  name: string;
  avatarUrl: string | null;
}
export interface MyProfile {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  emailVerified: boolean;
  hasPassword: boolean;
  createdAt: string;
}
