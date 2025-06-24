/**
 * Language Management Routes
 * User Service - AI-Powered eLearning Platform
 * 
 * User language preferences, goals, and progress tracking
 */

import express from 'express';
import { body, query, validationResult } from 'express-validator';
import asyncHandler from 'express-async-handler';
import { PrismaClient } from '@prisma/client';

import { logger } from '../utils/logger';
import { authMiddleware, requireSelfOrAdmin } from '../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

// =================================================================
// LANGUAGE DISCOVERY AND MANAGEMENT
// =================================================================

/**
 * GET /languages
 * Get all available languages in the platform
 */
router.get('/languages', asyncHandler(async (req, res) => {
    try {
        const { 
            category,
            script,
            region,
            search,
            limit = 50,
            offset = 0
        } = req.query;

        const where: any = { status: 'active' };

        if (category) {
            where.fsiCategory = parseInt(category as string);
        }
        if (script) {
            where.scriptType = script;
        }
        if (region) {
            where.region = { contains: region as string, mode: 'insensitive' };
        }
        if (search) {
            where.OR = [
                { nameEnglish: { contains: search as string, mode: 'insensitive' } },
                { nameNative: { contains: search as string, mode: 'insensitive' } },
                { isoCode: { contains: search as string, mode: 'insensitive' } }
            ];
        }

        const [languages, total] = await Promise.all([
            prisma.language.findMany({
                where,
                take: parseInt(limit as string),
                skip: parseInt(offset as string),
                orderBy: [
                    { fsiCategory: 'asc' },
                    { nameEnglish: 'asc' }
                ]
            }),
            prisma.language.count({ where })
        ]);

        // Get user counts for each language
        const languageStats = await prisma.userLanguage.groupBy({
            by: ['languageId'],
            _count: { languageId: true },
            where: {
                languageId: { in: languages.map(l => l.id) }
            }
        });

        const statsMap = languageStats.reduce((acc, stat) => {
            acc[stat.languageId] = stat._count.languageId;
            return acc;
        }, {} as Record<string, number>);

        const enrichedLanguages = languages.map(lang => ({
            ...lang,
            userCount: statsMap[lang.id] || 0,
            difficultyLevel: getDifficultyLevel(lang.fsiCategory),
            estimatedTimeToFluency: getEstimatedTimeToFluency(lang.fsiCategory)
        }));

        res.json({
            success: true,
            languages: enrichedLanguages,
            pagination: {
                total,
                limit: parseInt(limit as string),
                offset: parseInt(offset as string),
                hasMore: parseInt(offset as string) + parseInt(limit as string) < total
            }
        });

    } catch (error) {
        logger.error('Get languages error:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: 'Failed to retrieve languages'
        });
    }
}));

/**
 * GET /languages/popular
 * Get most popular languages
 */
router.get('/languages/popular', asyncHandler(async (req, res) => {
    try {
        const popularLanguages = await prisma.language.findMany({
            where: { status: 'active' },
            include: {
                userLanguages: {
                    where: { role: 'learning' }
                }
            },
            orderBy: {
                userLanguages: {
                    _count: 'desc'
                }
            },
            take: 10
        });

        const formattedLanguages = popularLanguages.map(lang => ({
            id: lang.id,
            code: lang.isoCode,
            name: lang.nameEnglish,
            nativeName: lang.nameNative,
            scriptType: lang.scriptType,
            writingDirection: lang.writingDirection,
            fsiCategory: lang.fsiCategory,
            difficultyLevel: getDifficultyLevel(lang.fsiCategory),
            userCount: lang.userLanguages.length,
            estimatedTimeToFluency: getEstimatedTimeToFluency(lang.fsiCategory)
        }));

        res.json({
            success: true,
            popularLanguages: formattedLanguages
        });

    } catch (error) {
        logger.error('Get popular languages error:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: 'Failed to retrieve popular languages'
        });
    }
}));

// =================================================================
// USER LANGUAGE MANAGEMENT
// =================================================================

/**
 * GET /users/:userId/languages
 * Get user's languages and progress
 */
router.get('/users/:userId/languages', [
    authMiddleware,
    requireSelfOrAdmin('userId')
], asyncHandler(async (req, res) => {
    try {
        const { userId } = req.params;

        const userLanguages = await prisma.userLanguage.findMany({
            where: { userId },
            include: { 
                language: true 
            },
            orderBy: [
                { isPrimary: 'desc' },
                { startedLearningAt: 'asc' }
            ]
        });

        const formattedLanguages = userLanguages.map(ul => ({
            id: ul.id,
            language: {
                id: ul.language.id,
                code: ul.language.isoCode,
                name: ul.language.nameEnglish,
                nativeName: ul.language.nameNative,
                scriptType: ul.language.scriptType,
                writingDirection: ul.language.writingDirection,
                fsiCategory: ul.language.fsiCategory,
                difficultyLevel: getDifficultyLevel(ul.language.fsiCategory)
            },
            role: ul.role,
            isPrimary: ul.isPrimary,
            currentLevel: {
                speaking: ul.currentFsiSpeakingLevel,
                reading: ul.currentFsiReadingLevel,
                listening: ul.currentFsiListeningLevel,
                writing: ul.currentFsiWritingLevel
            },
            targetLevel: {
                speaking: ul.targetFsiSpeakingLevel,
                reading: ul.targetFsiReadingLevel,
                listening: ul.targetFsiListeningLevel,
                writing: ul.targetFsiWritingLevel
            },
            learningGoals: ul.learningGoals,
            preferredLearningStyle: ul.preferredLearningStyle,
            dailyStudyTimeMinutes: ul.dailyStudyTimeMinutes,
            proficiencyTestDate: ul.proficiencyTestDate,
            certificationStatus: ul.certificationStatus,
            startedLearningAt: ul.startedLearningAt,
            lastActivityAt: ul.lastActivityAt,
            progress: calculateProgress(ul)
        }));

        res.json({
            success: true,
            languages: formattedLanguages
        });

    } catch (error) {
        logger.error('Get user languages error:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: 'Failed to retrieve user languages'
        });
    }
}));

/**
 * POST /users/:userId/languages
 * Add a new language to user's learning profile
 */
router.post('/users/:userId/languages', [
    authMiddleware,
    requireSelfOrAdmin('userId'),
    body('languageId')
        .isUUID()
        .withMessage('Language ID must be a valid UUID'),
    body('role')
        .isIn(['learning', 'teaching', 'native'])
        .withMessage('Role must be learning, teaching, or native'),
    body('targetFsiSpeakingLevel')
        .optional()
        .isFloat({ min: 0, max: 5 })
        .withMessage('Target speaking level must be between 0 and 5'),
    body('targetFsiReadingLevel')
        .optional()
        .isFloat({ min: 0, max: 5 })
        .withMessage('Target reading level must be between 0 and 5'),
    body('targetFsiListeningLevel')
        .optional()
        .isFloat({ min: 0, max: 5 })
        .withMessage('Target listening level must be between 0 and 5'),
    body('targetFsiWritingLevel')
        .optional()
        .isFloat({ min: 0, max: 5 })
        .withMessage('Target writing level must be between 0 and 5'),
    body('learningGoals')
        .optional()
        .isArray()
        .withMessage('Learning goals must be an array'),
    body('dailyStudyTimeMinutes')
        .optional()
        .isInt({ min: 15, max: 480 })
        .withMessage('Daily study time must be between 15 and 480 minutes')
], asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            error: 'Validation failed',
            details: errors.array()
        });
    }

    try {
        const { userId } = req.params;
        const {
            languageId,
            role,
            targetFsiSpeakingLevel,
            targetFsiReadingLevel,
            targetFsiListeningLevel,
            targetFsiWritingLevel,
            learningGoals = [],
            preferredLearningStyle = 'mixed',
            dailyStudyTimeMinutes = 30,
            isPrimary = false
        } = req.body;

        // Check if language exists
        const language = await prisma.language.findUnique({
            where: { id: languageId }
        });

        if (!language) {
            return res.status(404).json({
                error: 'Language not found',
                message: 'The specified language does not exist'
            });
        }

        // Check if user already has this language
        const existingUserLanguage = await prisma.userLanguage.findUnique({
            where: {
                userId_languageId_role: {
                    userId,
                    languageId,
                    role
                }
            }
        });

        if (existingUserLanguage) {
            return res.status(409).json({
                error: 'Language already added',
                message: 'This language is already in your learning profile'
            });
        }

        // If setting as primary, unset other primary languages
        if (isPrimary) {
            await prisma.userLanguage.updateMany({
                where: { userId, isPrimary: true },
                data: { isPrimary: false }
            });
        }

        // Create user language record
        const userLanguage = await prisma.userLanguage.create({
            data: {
                userId,
                languageId,
                role,
                targetFsiSpeakingLevel,
                targetFsiReadingLevel,
                targetFsiListeningLevel,
                targetFsiWritingLevel,
                learningGoals,
                preferredLearningStyle,
                dailyStudyTimeMinutes,
                isPrimary,
                // Set initial current levels to 0 for learning languages
                currentFsiSpeakingLevel: role === 'native' ? 5.0 : 0.0,
                currentFsiReadingLevel: role === 'native' ? 5.0 : 0.0,
                currentFsiListeningLevel: role === 'native' ? 5.0 : 0.0,
                currentFsiWritingLevel: role === 'native' ? 5.0 : 0.0
            },
            include: { language: true }
        });

        logger.info(`Language added to user profile: ${language.nameEnglish} for user ${userId}`);

        res.status(201).json({
            success: true,
            message: 'Language added to learning profile successfully',
            userLanguage: {
                id: userLanguage.id,
                language: {
                    id: language.id,
                    code: language.isoCode,
                    name: language.nameEnglish,
                    nativeName: language.nameNative
                },
                role: userLanguage.role,
                isPrimary: userLanguage.isPrimary,
                targetLevel: {
                    speaking: userLanguage.targetFsiSpeakingLevel,
                    reading: userLanguage.targetFsiReadingLevel,
                    listening: userLanguage.targetFsiListeningLevel,
                    writing: userLanguage.targetFsiWritingLevel
                }
            }
        });

    } catch (error) {
        logger.error('Add user language error:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: 'Failed to add language to profile'
        });
    }
}));

/**
 * PUT /users/:userId/languages/:userLanguageId
 * Update user language settings and goals
 */
router.put('/users/:userId/languages/:userLanguageId', [
    authMiddleware,
    requireSelfOrAdmin('userId'),
    body('targetFsiSpeakingLevel')
        .optional()
        .isFloat({ min: 0, max: 5 })
        .withMessage('Target speaking level must be between 0 and 5'),
    body('learningGoals')
        .optional()
        .isArray()
        .withMessage('Learning goals must be an array'),
    body('dailyStudyTimeMinutes')
        .optional()
        .isInt({ min: 15, max: 480 })
        .withMessage('Daily study time must be between 15 and 480 minutes')
], asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            error: 'Validation failed',
            details: errors.array()
        });
    }

    try {
        const { userId, userLanguageId } = req.params;
        const updateData = req.body;

        // Verify user language exists and belongs to user
        const userLanguage = await prisma.userLanguage.findFirst({
            where: {
                id: userLanguageId,
                userId
            },
            include: { language: true }
        });

        if (!userLanguage) {
            return res.status(404).json({
                error: 'User language not found',
                message: 'Language not found in user profile'
            });
        }

        // If setting as primary, unset other primary languages
        if (updateData.isPrimary === true) {
            await prisma.userLanguage.updateMany({
                where: { userId, isPrimary: true },
                data: { isPrimary: false }
            });
        }

        // Update user language
        const updatedUserLanguage = await prisma.userLanguage.update({
            where: { id: userLanguageId },
            data: updateData,
            include: { language: true }
        });

        logger.info(`Language settings updated: ${userLanguage.language.nameEnglish} for user ${userId}`);

        res.json({
            success: true,
            message: 'Language settings updated successfully',
            userLanguage: updatedUserLanguage
        });

    } catch (error) {
        logger.error('Update user language error:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: 'Failed to update language settings'
        });
    }
}));

/**
 * DELETE /users/:userId/languages/:userLanguageId
 * Remove language from user's profile
 */
router.delete('/users/:userId/languages/:userLanguageId', [
    authMiddleware,
    requireSelfOrAdmin('userId')
], asyncHandler(async (req, res) => {
    try {
        const { userId, userLanguageId } = req.params;

        const userLanguage = await prisma.userLanguage.findFirst({
            where: {
                id: userLanguageId,
                userId
            },
            include: { language: true }
        });

        if (!userLanguage) {
            return res.status(404).json({
                error: 'User language not found',
                message: 'Language not found in user profile'
            });
        }

        await prisma.userLanguage.delete({
            where: { id: userLanguageId }
        });

        logger.info(`Language removed from profile: ${userLanguage.language.nameEnglish} for user ${userId}`);

        res.json({
            success: true,
            message: 'Language removed from profile successfully'
        });

    } catch (error) {
        logger.error('Remove user language error:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: 'Failed to remove language from profile'
        });
    }
}));

// =================================================================
// HELPER FUNCTIONS
// =================================================================

function getDifficultyLevel(fsiCategory: number): string {
    switch (fsiCategory) {
        case 1: return 'Beginner';
        case 2: return 'Elementary';
        case 3: return 'Intermediate';
        case 4: return 'Advanced';
        case 5: return 'Expert';
        default: return 'Unknown';
    }
}

function getEstimatedTimeToFluency(fsiCategory: number): string {
    switch (fsiCategory) {
        case 1: return '600-750 hours';
        case 2: return '900 hours';
        case 3: return '1100-1320 hours';
        case 4: return '2200+ hours';
        case 5: return '2760+ hours';
        default: return 'Unknown';
    }
}

function calculateProgress(userLanguage: any): any {
    const current = {
        speaking: userLanguage.currentFsiSpeakingLevel || 0,
        reading: userLanguage.currentFsiReadingLevel || 0,
        listening: userLanguage.currentFsiListeningLevel || 0,
        writing: userLanguage.currentFsiWritingLevel || 0
    };

    const target = {
        speaking: userLanguage.targetFsiSpeakingLevel || 0,
        reading: userLanguage.targetFsiReadingLevel || 0,
        listening: userLanguage.targetFsiListeningLevel || 0,
        writing: userLanguage.targetFsiWritingLevel || 0
    };

    const currentAverage = (current.speaking + current.reading + current.listening + current.writing) / 4;
    const targetAverage = (target.speaking + target.reading + target.listening + target.writing) / 4;

    return {
        currentAverage,
        targetAverage,
        completionPercentage: targetAverage > 0 ? Math.round((currentAverage / targetAverage) * 100) : 0,
        skillProgress: {
            speaking: target.speaking > 0 ? Math.round((current.speaking / target.speaking) * 100) : 0,
            reading: target.reading > 0 ? Math.round((current.reading / target.reading) * 100) : 0,
            listening: target.listening > 0 ? Math.round((current.listening / target.listening) * 100) : 0,
            writing: target.writing > 0 ? Math.round((current.writing / target.writing) * 100) : 0
        }
    };
}

export { router as languagesRoutes };