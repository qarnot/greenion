type IdentityCreateInput = {
  email: string;
  password: string;
  role: 'admin' | 'user';
};

type IdentityCreateOutput = {
  id: string;
  email: string;
  metadata_public: {
    role: 'admin' | 'user';
  };
};
export type { IdentityCreateInput, IdentityCreateOutput };
