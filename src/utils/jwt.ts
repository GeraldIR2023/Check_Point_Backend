import * as jwt from 'jsonwebtoken';

export const generateJWT = (id: number, userTag: string, isAdmin: boolean) => {
  const token = jwt.sign({ id, userTag, isAdmin }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
  return token;
};

export const verifyJwt = (token: string) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET) as {
      id: number;
      userTag: string;
      isAdmin: boolean;
    };
  } catch (error) {
    return null;
  }
};
