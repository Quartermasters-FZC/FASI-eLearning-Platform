/**
 * Passport Configuration
 * AI-Powered eLearning Platform - Quartermasters FZC
 * 
 * Authentication strategies for JWT, Local, and SAML
 */

import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';
import { Strategy as SamlStrategy } from 'passport-saml';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

// =================================================================
// LOCAL STRATEGY (Email/Password)
// =================================================================

passport.use(new LocalStrategy({
    usernameField: 'email',
    passwordField: 'password',
    passReqToCallback: true
}, async (req, email, password, done) => {
    try {
        // Find user by email
        const user = await prisma.user.findUnique({
            where: { email: email.toLowerCase() },
            include: {
                userLanguages: {
                    include: { language: true }
                }
            }
        });

        if (!user) {
            return done(null, false, { message: 'Invalid email or password' });
        }

        // Check account status
        if (user.status !== 'active') {
            return done(null, false, { 
                message: 'Account is not active', 
                status: user.status 
            });
        }

        // Verify password
        const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
        if (!isPasswordValid) {
            return done(null, false, { message: 'Invalid email or password' });
        }

        // Remove sensitive data
        const { passwordHash, twoFactorSecret, ...safeUser } = user;

        logger.info(`Local authentication successful for user: ${user.email}`);
        return done(null, safeUser);

    } catch (error) {
        logger.error('Local strategy error:', error);
        return done(error);
    }
}));

// =================================================================
// JWT STRATEGY
// =================================================================

passport.use(new JwtStrategy({
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: process.env.JWT_SECRET!,
    issuer: 'elearning-platform',
    audience: 'elearning-users'
}, async (jwtPayload, done) => {
    try {
        // Find user by ID from JWT payload
        const user = await prisma.user.findUnique({
            where: { id: jwtPayload.userId },
            include: {
                userLanguages: {
                    include: { language: true }
                }
            }
        });

        if (!user) {
            return done(null, false, { message: 'User not found' });
        }

        // Check account status
        if (user.status !== 'active') {
            return done(null, false, { 
                message: 'Account is not active', 
                status: user.status 
            });
        }

        // Update last active time
        await prisma.user.update({
            where: { id: user.id },
            data: { lastActiveAt: new Date() }
        });

        // Remove sensitive data
        const { passwordHash, twoFactorSecret, ...safeUser } = user;

        return done(null, safeUser);

    } catch (error) {
        logger.error('JWT strategy error:', error);
        return done(error);
    }
}));

// =================================================================
// SAML STRATEGY (for SSO with government systems)
// =================================================================

if (process.env.SAML_ENABLED === 'true') {
    passport.use(new SamlStrategy({
        callbackUrl: process.env.SAML_CALLBACK_URL || '/auth/saml/callback',
        entryPoint: process.env.SAML_ENTRY_POINT!,
        issuer: process.env.SAML_ISSUER || 'elearning-platform',
        cert: process.env.SAML_CERT!,
        privateCert: process.env.SAML_PRIVATE_KEY,
        identifierFormat: 'urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress',
        acceptedClockSkewMs: 5000,
        attributeConsumingServiceIndex: false,
        disableRequestedAuthnContext: true,
        signatureAlgorithm: 'sha256'
    }, async (profile, done) => {
        try {
            logger.info('SAML authentication attempt:', {
                nameID: profile.nameID,
                sessionIndex: profile.sessionIndex
            });

            // Extract user information from SAML profile
            const email = profile.nameID || profile.email;
            const firstName = profile.firstName || profile.givenName || '';
            const lastName = profile.lastName || profile.surname || '';
            const organization = profile.organization || profile.company || '';
            const department = profile.department || '';
            const jobTitle = profile.jobTitle || profile.title || '';

            if (!email) {
                return done(new Error('Email is required from SAML response'), false);
            }

            // Find or create user
            let user = await prisma.user.findUnique({
                where: { email: email.toLowerCase() },
                include: {
                    userLanguages: {
                        include: { language: true }
                    }
                }
            });

            if (!user) {
                // Create new user from SAML data
                user = await prisma.user.create({
                    data: {
                        email: email.toLowerCase(),
                        passwordHash: '', // SAML users don't need password
                        firstName,
                        lastName,
                        displayName: `${firstName} ${lastName}`.trim(),
                        organization,
                        department,
                        jobTitle,
                        status: 'active',
                        role: 'student', // Default role
                        emailVerifiedAt: new Date() // SAML users are pre-verified
                    },
                    include: {
                        userLanguages: {
                            include: { language: true }
                        }
                    }
                });

                logger.info(`New SAML user created: ${user.email}`);
            } else {
                // Update existing user with latest SAML data
                user = await prisma.user.update({
                    where: { id: user.id },
                    data: {
                        firstName: firstName || user.firstName,
                        lastName: lastName || user.lastName,
                        organization: organization || user.organization,
                        department: department || user.department,
                        jobTitle: jobTitle || user.jobTitle,
                        lastLoginAt: new Date(),
                        lastActiveAt: new Date()
                    },
                    include: {
                        userLanguages: {
                            include: { language: true }
                        }
                    }
                });

                logger.info(`SAML user updated: ${user.email}`);
            }

            // Check account status
            if (user.status !== 'active') {
                return done(null, false, { 
                    message: 'Account is not active', 
                    status: user.status 
                });
            }

            // Remove sensitive data
            const { passwordHash, twoFactorSecret, ...safeUser } = user;

            return done(null, safeUser);

        } catch (error) {
            logger.error('SAML strategy error:', error);
            return done(error);
        }
    }));
}

// =================================================================
// PASSPORT SESSION SERIALIZATION
// =================================================================

passport.serializeUser((user: any, done) => {
    done(null, user.id);
});

passport.deserializeUser(async (id: string, done) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id },
            include: {
                userLanguages: {
                    include: { language: true }
                }
            }
        });

        if (!user) {
            return done(null, false);
        }

        // Remove sensitive data
        const { passwordHash, twoFactorSecret, ...safeUser } = user;
        done(null, safeUser);

    } catch (error) {
        logger.error('User deserialization error:', error);
        done(error);
    }
});

export { passport };