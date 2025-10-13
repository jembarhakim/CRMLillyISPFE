export type CreateUserRequest = {
  name: String,
  email: String,
  logo_url: String,
  role_id: String,
  password: String,
  password_confirm: String,
  phone:String
  }

  export type CreateRoleRequest = {
  name: string,
  role_permissions: Array<{
    feature_id: string;
    feature_name: string;
    can_access: number;
  }>
  }