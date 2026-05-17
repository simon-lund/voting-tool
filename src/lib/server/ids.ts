import { nanoid } from 'nanoid';

export function generateToken(length = 32): string {
	return nanoid(length);
}
