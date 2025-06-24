/**
 * User Profile Management Routes
 * User Service - AI-Powered eLearning Platform
 * 
 * Comprehensive user profile and preference management
 */

import express from 'express';
import { body, validationResult } from 'express-validator';
import asyncHandler from 'express-async-handler';
import { PrismaClient } from '@prisma/client';
import multer from 'multer';
import sharp from 'sharp';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

import { logger } from '../utils/logger';
import { authMiddleware, requireSelfOrAdmin } from '../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

// Configure multer for avatar uploads
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
    },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed'));
        }
    }
});

// =================================================================
// PROFILE MANAGEMENT ROUTES
// =================================================================

/**
 * GET /profile/:userId
 * Get user profile (self or admin access)
 */
router.get('/profile/:userId', [
    authMiddleware,
    requireSelfOrAdmin('userId')
], asyncHandler(async (req, res) => {
    try {
        const { userId } = req.params;

        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: {
                userLanguages: {
                    include: { 
                        language: true 
                    },
                    orderBy: [
                        { isPrimary: 'desc' },
                        { startedLearningAt: 'asc' }
                    ]
                }
            }
        });

        if (!user) {
            return res.status(404).json({
                error: 'User not found',
                message: 'User profile not found'
            });
        }

        // Remove sensitive data
        const { passwordHash, twoFactorSecret, ...safeUser } = user;

        // Format user languages with progress
        const languages = user.userLanguages.map(ul => ({
            id: ul.language.id,
            code: ul.language.isoCode,
            name: ul.language.nameEnglish,
            nativeName: ul.language.nameNative,
            scriptType: ul.language.scriptType,
            writingDirection: ul.language.writingDirection,
            fsiCategory: ul.language.fsiCategory,
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
            startedLearningAt: ul.startedLearningAt,
            lastActivityAt: ul.lastActivityAt
        }));

        // Calculate overall progress
        const overallProgress = languages.reduce((acc, lang) => {
            const currentAvg = (
                (lang.currentLevel.speaking || 0) +
                (lang.currentLevel.reading || 0) +
                (lang.currentLevel.listening || 0) +
                (lang.currentLevel.writing || 0)
            ) / 4;
            const targetAvg = (
                (lang.targetLevel.speaking || 0) +
                (lang.targetLevel.reading || 0) +
                (lang.targetLevel.listening || 0) +
                (lang.targetLevel.writing || 0)
            ) / 4;
            
            acc.currentAverage += currentAvg;
            acc.targetAverage += targetAvg;
            return acc;
        }, { currentAverage: 0, targetAverage: 0 });

        if (languages.length > 0) {
            overallProgress.currentAverage /= languages.length;
            overallProgress.targetAverage /= languages.length;
        }

        const profile = {
            ...safeUser,
            languages,
            stats: {
                totalLanguages: languages.length,
                activeLanguages: languages.filter(l => l.role === 'learning').length,
                nativeLanguages: languages.filter(l => l.role === 'native').length,
                overallProgress,
                completionPercentage: overallProgress.targetAverage > 0 
                    ? Math.round((overallProgress.currentAverage / overallProgress.targetAverage) * 100)
                    : 0
            }
        };

        res.json({
            success: true,
            profile
        });

    } catch (error) {
        logger.error('Get profile error:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: 'Failed to retrieve user profile'
        });
    }
}));

/**
 * PUT /profile/:userId
 * Update user profile
 */
router.put('/profile/:userId', [
    authMiddleware,
    requireSelfOrAdmin('userId'),
    body('firstName')
        .optional()
        .trim()
        .isLength({ min: 1, max: 100 })
        .withMessage('First name must be 1-100 characters'),
    body('lastName')
        .optional()
        .trim()
        .isLength({ min: 1, max: 100 })
        .withMessage('Last name must be 1-100 characters'),
    body('phone')
        .optional()
        .isMobilePhone('any')
        .withMessage('Invalid phone number'),
    body('timezone')
        .optional()
        .isString()
        .withMessage('Timezone must be a valid string'),
    body('preferredLanguageId')
        .optional()
        .isUUID()
        .withMessage('Preferred language ID must be a valid UUID')
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
            firstName,
            lastName,
            phone,
            timezone,
            preferredLanguageId,
            jobTitle,
            department
        } = req.body;

        const updateData: any = {};
        
        if (firstName !== undefined) updateData.firstName = firstName;
        if (lastName !== undefined) updateData.lastName = lastName;
        if (phone !== undefined) updateData.phone = phone;
        if (timezone !== undefined) updateData.timezone = timezone;
        if (jobTitle !== undefined) updateData.jobTitle = jobTitle;
        if (department !== undefined) updateData.department = department;

        if (preferredLanguageId !== undefined) {
            const language = await prisma.language.findUnique({
                where: { id: preferredLanguageId }
            });
            if (!language) {
                return res.status(400).json({
                    error: 'Invalid language',
                    message: 'Preferred language not found'
                });
            }
            updateData.preferredLanguageId = preferredLanguageId;
        }

        // Auto-generate display name if names changed
        if (firstName || lastName) {
            const currentUser = await prisma.user.findUnique({
                where: { id: userId }
            });
            if (currentUser) {
                const newFirstName = firstName || currentUser.firstName;
                const newLastName = lastName || currentUser.lastName;
                updateData.displayName = `${newFirstName} ${newLastName}`.trim();
            }
        }

        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: updateData,
            include: {
                userLanguages: {
                    include: { language: true }
                }
            }
        });

        const { passwordHash, twoFactorSecret, ...safeUser } = updatedUser;

        logger.info(`User profile updated: ${updatedUser.email} by ${req.user!.email}`);

        res.json({
            success: true,
            message: 'Profile updated successfully',
            profile: safeUser
        });

    } catch (error) {
        logger.error('Update profile error:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: 'Failed to update user profile'
        });
    }
}));

/**
 * POST /profile/:userId/avatar
 * Upload user avatar
 */
router.post('/profile/:userId/avatar', [
    authMiddleware,
    requireSelfOrAdmin('userId'),
    upload.single('avatar')
], asyncHandler(async (req, res) => {
    try {
        const { userId } = req.params;

        if (!req.file) {
            return res.status(400).json({
                error: 'No file uploaded',
                message: 'Please provide an avatar image'
            });
        }

        // Process image with Sharp
        const filename = `avatar-${userId}-${uuidv4()}.webp`;
        const avatarBuffer = await sharp(req.file.buffer)
            .resize(256, 256, {
                fit: 'cover',
                position: 'center'
            })
            .webp({ quality: 85 })
            .toBuffer();

        // In production, upload to S3/CloudFront
        // For now, we'll simulate the URL
        const avatarUrl = `/uploads/avatars/${filename}`;

        // Update user avatar URL
        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: { avatarUrl }
        });

        logger.info(`Avatar updated for user: ${updatedUser.email}`);

        res.json({
            success: true,
            message: 'Avatar uploaded successfully',
            avatarUrl
        });

    } catch (error) {
        logger.error('Avatar upload error:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: 'Failed to upload avatar'
        });
    }
}));

/**
 * DELETE /profile/:userId/avatar
 * Remove user avatar
 */
router.delete('/profile/:userId/avatar', [
    authMiddleware,
    requireSelfOrAdmin('userId')
], asyncHandler(async (req, res) => {
    try {
        const { userId } = req.params;

        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: { avatarUrl: null }
        });

        logger.info(`Avatar removed for user: ${updatedUser.email}`);

        res.json({
            success: true,
            message: 'Avatar removed successfully'
        });

    } catch (error) {
        logger.error('Avatar removal error:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: 'Failed to remove avatar'
        });
    }
}));

/**
 * GET /profile/:userId/analytics
 * Get user learning analytics
 */
router.get('/profile/:userId/analytics', [
    authMiddleware,
    requireSelfOrAdmin('userId')
], asyncHandler(async (req, res) => {
    try {
        const { userId } = req.params;
        const { timeframe = '30d' } = req.query;

        // Calculate date range
        let startDate: Date;
        switch (timeframe) {
            case '7d':
                startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
                break;
            case '30d':
                startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
                break;
            case '90d':
                startDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
                break;
            default:
                startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        }

        // Get learning analytics data
        const analytics = await prisma.learningAnalytics.findMany({
            where: {
                userId,
                analyticsDate: {
                    gte: startDate
                }
            },
            include: {
                language: true
            },
            orderBy: { analyticsDate: 'asc' }
        });

        // Aggregate data by language
        const languageStats = analytics.reduce((acc, record) => {
            const langCode = record.language.isoCode;
            if (!acc[langCode]) {
                acc[langCode] = {
                    language: {
                        code: record.language.isoCode,
                        name: record.language.nameEnglish,
                        nativeName: record.language.nameNative
                    },
                    totalStudyTime: 0,
                    totalLessons: 0,
                    totalAssessments: 0,
                    averageScore: 0,
                    progressData: []
                };
            }

            acc[langCode].totalStudyTime += record.studyTimeMinutes || 0;
            acc[langCode].totalLessons += record.lessonsCompleted || 0;
            acc[langCode].totalAssessments += record.assessmentsTaken || 0;
            
            acc[langCode].progressData.push({
                date: record.analyticsDate,
                studyTime: record.studyTimeMinutes,
                lessons: record.lessonsCompleted,
                assessments: record.assessmentsTaken,
                score: record.averageScore,
                engagementScore: record.engagementScore,
                fsiProgress: record.fsiProgressDelta
            });

            return acc;
        }, {} as any);

        // Calculate overall statistics
        const overallStats = {
            totalStudyTimeMinutes: analytics.reduce((sum, a) => sum + (a.studyTimeMinutes || 0), 0),
            totalLessonsCompleted: analytics.reduce((sum, a) => sum + (a.lessonsCompleted || 0), 0),
            totalAssessmentsCompleted: analytics.reduce((sum, a) => sum + (a.assessmentsTaken || 0), 0),
            averageEngagementScore: analytics.length > 0 
                ? analytics.reduce((sum, a) => sum + (a.engagementScore || 0), 0) / analytics.length 
                : 0,
            averageScore: analytics.length > 0 
                ? analytics.reduce((sum, a) => sum + (a.averageScore || 0), 0) / analytics.length 
                : 0,
            streakDays: calculateLearningStreak(analytics)
        };

        res.json({
            success: true,
            analytics: {
                timeframe,
                overall: overallStats,
                byLanguage: Object.values(languageStats),
                dailyData: analytics.map(a => ({
                    date: a.analyticsDate,
                    totalStudyTime: a.studyTimeMinutes,
                    lessons: a.lessonsCompleted,
                    assessments: a.assessmentsTaken,
                    averageScore: a.averageScore,
                    engagementScore: a.engagementScore
                }))
            }
        });

    } catch (error) {
        logger.error('Get user analytics error:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: 'Failed to retrieve user analytics'
        });
    }
}));

/**
 * Helper function to calculate learning streak
 */
function calculateLearningStreak(analytics: any[]): number {
    if (analytics.length === 0) return 0;

    const sortedDates = analytics
        .map(a => a.analyticsDate)
        .sort((a, b) => b.getTime() - a.getTime());

    let streak = 0;
    let currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);

    for (const date of sortedDates) {
        const analyticsDate = new Date(date);
        analyticsDate.setHours(0, 0, 0, 0);

        const daysDiff = (currentDate.getTime() - analyticsDate.getTime()) / (1000 * 60 * 60 * 24);

        if (daysDiff === streak) {
            streak++;
        } else if (daysDiff > streak + 1) {
            break;
        }
    }

    return streak;
}

export { router as profileRoutes };