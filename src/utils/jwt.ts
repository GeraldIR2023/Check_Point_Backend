import * as jwt from 'jsonwebtoken';

export const generateJWT = (id: number, userTag: string, isAdmin: boolean) => {
  const secret = process.env.JWT_SECRET as string;
  const token = jwt.sign({ id, userTag, isAdmin }, secret, {
    expiresIn: '30d',
  });
  return token;
};

export const verifyJwt = (token: string) => {
  try {
    const secret = process.env.JWT_SECRET as string;

    const decoded = jwt.verify(token, secret) as unknown as {
      id: number;
      userTag: string;
      isAdmin: boolean;
    };

    return decoded;
  } catch (error) {
    return null;
  }
};
