export interface UserLogin {
  email: string;
  password: string;
}

export interface UserRegister {
  fullname: string;
  email: string;
  password: string;
}
export interface UserProfilePublic {
  id: number;
  name: string;
  avatarUrl: string;
}

export interface UserProfilePrivate extends UserProfilePublic {
  email: string;
  address: string;
  phoneNumber: number;
}
