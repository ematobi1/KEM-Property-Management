import bcrypt from 'bcryptjs';
import jwt, { type SignOptions } from 'jsonwebtoken';
import { prisma } from '../../db/client';
import { config } from '../../config';
import { UnauthorizedError } from '../../shared/errors/AppError';
import { LoginInput } from './auth.schema';

export async function login(input: LoginInput) {
  const property = await prisma.property.findUnique({
    where: { code: input.propertyCode },
    select: { id: true },
  });

  // Use the same error for unknown property and wrong credentials (no oracle)
  const credentialError = new UnauthorizedError('Invalid credentials');
  if (!property) throw credentialError;

  const user = await prisma.user.findUnique({
    where: { email_propertyId: { email: input.email, propertyId: property.id } },
    select: { id: true, propertyId: true, role: true, passwordHash: true, firstName: true, lastName: true, initials: true },
  });

  if (!user) throw credentialError;

  const valid = await bcrypt.compare(input.password, user.passwordHash);
  if (!valid) throw credentialError;

  const token = jwt.sign(
    { userId: user.id, propertyId: user.propertyId, role: user.role },
    config.JWT_SECRET,
    { expiresIn: config.JWT_EXPIRES_IN as NonNullable<SignOptions['expiresIn']> },
  );

  return {
    token,
    user: {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      initials: user.initials,
      role: user.role,
      propertyId: user.propertyId,
    },
  };
}
