/**
 * Lesson Management Routes
 * Content Service - AI-Powered eLearning Platform
 * 
 * Individual lesson content and progress tracking
 */

import express from 'express';
import { body, query, validationResult } from 'express-validator';
import asyncHandler from 'express-async-handler';
import { PrismaClient } from '@prisma/client';
import multer from 'multer';
import sharp from 'sharp';
import ffmpeg from 'fluent-ffmpeg';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';

import { logger } from '../utils/logger';
import { authMiddleware, requireRole, optionalAuthMiddleware } from '../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

// Configure multer for lesson content uploads
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 500 * 1024 * 1024, // 500MB for video content
    },
    fileFilter: (req, file, cb) => {
        const allowedMimes = [
            'image/jpeg', 'image/png', 'image/webp',
            'video/mp4', 'video/webm', 'video/quicktime',
            'audio/mpeg', 'audio/wav', 'audio/ogg',
            'application/pdf', 'text/plain'
        ];
        
        if (allowedMimes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Unsupported file type'));
        }
    }
});

// =================================================================
// LESSON CONTENT ROUTES
// =================================================================

/**
 * GET /courses/:courseId/modules/:moduleId/lessons
 * Get all lessons in a module
 */
router.get('/courses/:courseId/modules/:moduleId/lessons', [
    optionalAuthMiddleware
], asyncHandler(async (req, res) => {
    try {
        const { courseId, moduleId } = req.params;

        // Check if course and module exist
        const course = await prisma.course.findUnique({
            where: { id: courseId },
            include: {
                courseModules: {
                    where: { id: moduleId }
                }
            }
        });

        if (!course || course.courseModules.length === 0) {
            return res.status(404).json({
                error: 'Course or module not found',
                message: 'The requested course or module does not exist'
            });
        }

        // Check if user has access to the course
        let hasAccess = course.isPublished;
        if (req.user) {
            // Check if user is enrolled or is instructor/admin
            const isInstructor = course.instructorId === req.user.id;
            const isAdmin = ['admin', 'super_admin'].includes(req.user.role);
            
            if (isInstructor || isAdmin) {
                hasAccess = true;
            } else {
                const enrollment = await prisma.courseEnrollment.findUnique({
                    where: {
                        studentId_courseId: {
                            studentId: req.user.id,
                            courseId: course.id
                        }
                    }
                });
                hasAccess = hasAccess && (enrollment?.status === 'active');
            }
        }

        if (!hasAccess) {
            return res.status(403).json({
                error: 'Access denied',
                message: 'You do not have access to this course content'
            });
        }

        // Get lessons with progress tracking
        const lessons = await prisma.lesson.findMany({
            where: { 
                moduleId,
                isPublished: hasAccess ? undefined : true
            },
            orderBy: { lessonNumber: 'asc' },
            include: {
                ...(req.user && {
                    studentProgress: {
                        where: { studentId: req.user.id }
                    }
                })
            }
        });

        const formattedLessons = lessons.map(lesson => ({
            id: lesson.id,
            title: lesson.title,
            description: lesson.description,
            lessonNumber: lesson.lessonNumber,
            type: lesson.lessonType,
            contentUrl: lesson.contentUrl,
            estimatedDurationMinutes: lesson.estimatedDurationMinutes,
            difficultyLevel: lesson.difficultyLevel,
            learningObjectives: lesson.learningObjectives,
            vocabularyFocus: lesson.vocabularyFocus,
            grammarFocus: lesson.grammarFocus,
            culturalNotes: lesson.culturalNotes,
            isPublished: lesson.isPublished,
            ...(req.user && lesson.studentProgress && lesson.studentProgress.length > 0 && {
                progress: {
                    status: lesson.studentProgress[0].status,
                    completionPercentage: lesson.studentProgress[0].completionPercentage,
                    timeSpentMinutes: lesson.studentProgress[0].timeSpentMinutes,
                    lastAccessedAt: lesson.studentProgress[0].lastAccessedAt
                }
            })
        }));

        res.json({
            success: true,
            lessons: formattedLessons,
            moduleInfo: {
                id: course.courseModules[0].id,
                title: course.courseModules[0].title,
                description: course.courseModules[0].description,
                moduleNumber: course.courseModules[0].moduleNumber
            }
        });

    } catch (error) {
        logger.error('Get lessons error:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: 'Failed to retrieve lessons'
        });
    }
}));

/**
 * GET /lessons/:lessonId
 * Get detailed lesson content
 */
router.get('/lessons/:lessonId', [
    optionalAuthMiddleware
], asyncHandler(async (req, res) => {
    try {
        const { lessonId } = req.params;

        const lesson = await prisma.lesson.findUnique({
            where: { id: lessonId },
            include: {
                module: {
                    include: {
                        course: {
                            include: {
                                language: true,
                                instructor: {
                                    select: {
                                        id: true,
                                        firstName: true,
                                        lastName: true,
                                        displayName: true,
                                        avatarUrl: true
                                    }
                                }
                            }
                        }
                    }
                },
                ...(req.user && {
                    studentProgress: {
                        where: { studentId: req.user.id }
                    }
                })
            }
        });

        if (!lesson) {
            return res.status(404).json({
                error: 'Lesson not found',
                message: 'The requested lesson does not exist'
            });
        }

        // Check access permissions
        let hasAccess = lesson.isPublished && lesson.module.course.isPublished;
        if (req.user) {
            const isInstructor = lesson.module.course.instructorId === req.user.id;
            const isAdmin = ['admin', 'super_admin'].includes(req.user.role);
            
            if (isInstructor || isAdmin) {
                hasAccess = true;
            } else {
                const enrollment = await prisma.courseEnrollment.findUnique({
                    where: {
                        studentId_courseId: {
                            studentId: req.user.id,
                            courseId: lesson.module.course.id
                        }
                    }
                });
                hasAccess = hasAccess && (enrollment?.status === 'active');
            }
        }

        if (!hasAccess) {
            return res.status(403).json({
                error: 'Access denied',
                message: 'You do not have access to this lesson'
            });
        }

        // Track lesson access if user is authenticated
        if (req.user && hasAccess) {
            await prisma.studentLessonProgress.upsert({
                where: {
                    studentId_lessonId: {
                        studentId: req.user.id,
                        lessonId: lesson.id
                    }
                },
                update: {
                    lastAccessedAt: new Date()
                },
                create: {
                    studentId: req.user.id,
                    lessonId: lesson.id,
                    status: 'in_progress',
                    completionPercentage: 0,
                    timeSpentMinutes: 0
                }
            });
        }

        const detailedLesson = {
            id: lesson.id,
            title: lesson.title,
            description: lesson.description,
            lessonNumber: lesson.lessonNumber,
            type: lesson.lessonType,
            contentUrl: lesson.contentUrl,
            contentData: lesson.contentData,
            transcript: lesson.transcript,
            estimatedDurationMinutes: lesson.estimatedDurationMinutes,
            difficultyLevel: lesson.difficultyLevel,
            learningObjectives: lesson.learningObjectives,
            vocabularyFocus: lesson.vocabularyFocus,
            grammarFocus: lesson.grammarFocus,
            culturalNotes: lesson.culturalNotes,
            course: {
                id: lesson.module.course.id,
                title: lesson.module.course.title,
                language: {
                    code: lesson.module.course.language.isoCode,
                    name: lesson.module.course.language.nameEnglish,
                    nativeName: lesson.module.course.language.nameNative,
                    scriptType: lesson.module.course.language.scriptType,
                    writingDirection: lesson.module.course.language.writingDirection
                },
                instructor: lesson.module.course.instructor
            },
            module: {
                id: lesson.module.id,
                title: lesson.module.title,
                moduleNumber: lesson.module.moduleNumber
            },
            ...(req.user && lesson.studentProgress && lesson.studentProgress.length > 0 && {
                progress: {
                    status: lesson.studentProgress[0].status,
                    completionPercentage: lesson.studentProgress[0].completionPercentage,
                    timeSpentMinutes: lesson.studentProgress[0].timeSpentMinutes,
                    lastAccessedAt: lesson.studentProgress[0].lastAccessedAt,
                    startedAt: lesson.studentProgress[0].startedAt
                }
            }),
            createdAt: lesson.createdAt,
            updatedAt: lesson.updatedAt
        };

        res.json({
            success: true,
            lesson: detailedLesson
        });

    } catch (error) {
        logger.error('Get lesson details error:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: 'Failed to retrieve lesson details'
        });
    }
}));

/**
 * POST /lessons/:lessonId/progress
 * Update lesson progress
 */
router.post('/lessons/:lessonId/progress', [
    authMiddleware,
    body('completionPercentage')
        .isFloat({ min: 0, max: 100 })
        .withMessage('Completion percentage must be between 0 and 100'),
    body('timeSpentMinutes')
        .isInt({ min: 0 })
        .withMessage('Time spent must be a positive integer'),
    body('status')
        .optional()
        .isIn(['not_started', 'in_progress', 'completed'])
        .withMessage('Invalid status')
], asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            error: 'Validation failed',
            details: errors.array()
        });
    }

    try {
        const { lessonId } = req.params;
        const { completionPercentage, timeSpentMinutes, status } = req.body;

        // Verify lesson exists and user has access
        const lesson = await prisma.lesson.findUnique({
            where: { id: lessonId },
            include: {
                module: {
                    include: {
                        course: true
                    }
                }
            }
        });

        if (!lesson) {
            return res.status(404).json({
                error: 'Lesson not found',
                message: 'The requested lesson does not exist'
            });
        }

        // Check enrollment
        const enrollment = await prisma.courseEnrollment.findUnique({
            where: {
                studentId_courseId: {
                    studentId: req.user!.id,
                    courseId: lesson.module.course.id
                }
            }
        });

        if (!enrollment || enrollment.status !== 'active') {
            return res.status(403).json({
                error: 'Access denied',
                message: 'You are not enrolled in this course'
            });
        }

        // Determine status based on completion percentage
        let finalStatus = status;
        if (!finalStatus) {
            if (completionPercentage === 0) {
                finalStatus = 'not_started';
            } else if (completionPercentage >= 100) {
                finalStatus = 'completed';
            } else {
                finalStatus = 'in_progress';
            }
        }

        // Update or create progress
        const progress = await prisma.studentLessonProgress.upsert({
            where: {
                studentId_lessonId: {
                    studentId: req.user!.id,
                    lessonId: lesson.id
                }
            },
            update: {
                completionPercentage,
                timeSpentMinutes,
                status: finalStatus,
                lastAccessedAt: new Date(),
                ...(finalStatus === 'completed' && { completedAt: new Date() })
            },
            create: {
                studentId: req.user!.id,
                lessonId: lesson.id,
                completionPercentage,
                timeSpentMinutes,
                status: finalStatus,
                startedAt: new Date(),
                lastAccessedAt: new Date(),
                ...(finalStatus === 'completed' && { completedAt: new Date() })
            }
        });

        // Update module progress if lesson is completed
        if (finalStatus === 'completed') {
            await updateModuleProgress(req.user!.id, lesson.moduleId);
        }

        logger.info(`Lesson progress updated: ${lesson.title} for user ${req.user!.id}`);

        res.json({
            success: true,
            message: 'Progress updated successfully',
            progress: {
                status: progress.status,
                completionPercentage: progress.completionPercentage,
                timeSpentMinutes: progress.timeSpentMinutes,
                lastAccessedAt: progress.lastAccessedAt
            }
        });

    } catch (error) {
        logger.error('Update lesson progress error:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: 'Failed to update lesson progress'
        });
    }
}));

// =================================================================
// LESSON MANAGEMENT ROUTES (Instructor/Admin)
// =================================================================

/**
 * POST /courses/:courseId/modules/:moduleId/lessons
 * Create a new lesson (instructor/admin only)
 */
router.post('/courses/:courseId/modules/:moduleId/lessons', [
    authMiddleware,
    requireRole(['instructor', 'admin', 'super_admin']),
    body('title')
        .isLength({ min: 5, max: 500 })
        .withMessage('Title must be 5-500 characters'),
    body('description')
        .optional()
        .isLength({ max: 2000 })
        .withMessage('Description must be less than 2000 characters'),
    body('lessonType')
        .isIn(['video', 'audio', 'text', 'interactive', 'exercise'])
        .withMessage('Invalid lesson type'),
    body('estimatedDurationMinutes')
        .optional()
        .isInt({ min: 1, max: 480 })
        .withMessage('Duration must be between 1 and 480 minutes'),
    body('difficultyLevel')
        .optional()
        .isInt({ min: 1, max: 5 })
        .withMessage('Difficulty level must be between 1 and 5')
], asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            error: 'Validation failed',
            details: errors.array()
        });
    }

    try {
        const { courseId, moduleId } = req.params;
        const {
            title,
            description,
            lessonType,
            estimatedDurationMinutes,
            difficultyLevel = 1,
            learningObjectives = [],
            vocabularyFocus = [],
            grammarFocus = [],
            culturalNotes
        } = req.body;

        // Verify course and module exist and user has permission
        const course = await prisma.course.findUnique({
            where: { id: courseId },
            include: {
                courseModules: {
                    where: { id: moduleId }
                }
            }
        });

        if (!course || course.courseModules.length === 0) {
            return res.status(404).json({
                error: 'Course or module not found',
                message: 'The requested course or module does not exist'
            });
        }

        // Check permissions
        const isInstructor = course.instructorId === req.user!.id;
        const isAdmin = ['admin', 'super_admin'].includes(req.user!.role);

        if (!isInstructor && !isAdmin) {
            return res.status(403).json({
                error: 'Access denied',
                message: 'You do not have permission to create lessons for this course'
            });
        }

        // Get next lesson number
        const lastLesson = await prisma.lesson.findFirst({
            where: { moduleId },
            orderBy: { lessonNumber: 'desc' }
        });
        const lessonNumber = (lastLesson?.lessonNumber || 0) + 1;

        // Create lesson
        const lesson = await prisma.lesson.create({
            data: {
                moduleId,
                title,
                description,
                lessonNumber,
                lessonType,
                estimatedDurationMinutes,
                difficultyLevel,
                learningObjectives,
                vocabularyFocus,
                grammarFocus,
                culturalNotes,
                isPublished: false // Start as draft
            }
        });

        logger.info(`Lesson created: ${lesson.title} in course ${course.title} by ${req.user!.email}`);

        res.status(201).json({
            success: true,
            message: 'Lesson created successfully',
            lesson: {
                id: lesson.id,
                title: lesson.title,
                lessonNumber: lesson.lessonNumber,
                type: lesson.lessonType,
                difficultyLevel: lesson.difficultyLevel,
                isPublished: lesson.isPublished
            }
        });

    } catch (error) {
        logger.error('Create lesson error:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: 'Failed to create lesson'
        });
    }
}));

/**
 * PUT /lessons/:lessonId/content
 * Upload lesson content (video, audio, documents)
 */
router.put('/lessons/:lessonId/content', [
    authMiddleware,
    requireRole(['instructor', 'admin', 'super_admin']),
    upload.single('content')
], asyncHandler(async (req, res) => {
    try {
        const { lessonId } = req.params;

        const lesson = await prisma.lesson.findUnique({
            where: { id: lessonId },
            include: {
                module: {
                    include: {
                        course: true
                    }
                }
            }
        });

        if (!lesson) {
            return res.status(404).json({
                error: 'Lesson not found',
                message: 'The requested lesson does not exist'
            });
        }

        // Check permissions
        const isInstructor = lesson.module.course.instructorId === req.user!.id;
        const isAdmin = ['admin', 'super_admin'].includes(req.user!.role);

        if (!isInstructor && !isAdmin) {
            return res.status(403).json({
                error: 'Access denied',
                message: 'You do not have permission to modify this lesson'
            });
        }

        if (!req.file) {
            return res.status(400).json({
                error: 'No file uploaded',
                message: 'Please provide content file'
            });
        }

        // Process different content types
        let contentUrl = '';
        let processedContent = null;

        if (req.file.mimetype.startsWith('image/')) {
            // Process images
            const filename = `lesson-${lessonId}-${uuidv4()}.webp`;
            processedContent = await sharp(req.file.buffer)
                .resize(1920, 1080, { fit: 'inside', withoutEnlargement: true })
                .webp({ quality: 85 })
                .toBuffer();
            contentUrl = `/uploads/lessons/${filename}`;
        } else if (req.file.mimetype.startsWith('video/')) {
            // Process videos (convert to web-friendly formats)
            const filename = `lesson-${lessonId}-${uuidv4()}.mp4`;
            contentUrl = `/uploads/lessons/${filename}`;
            // In production, process with FFmpeg and upload to CDN
        } else if (req.file.mimetype.startsWith('audio/')) {
            // Process audio
            const filename = `lesson-${lessonId}-${uuidv4()}.mp3`;
            contentUrl = `/uploads/lessons/${filename}`;
        } else {
            // Handle documents
            const extension = path.extname(req.file.originalname);
            const filename = `lesson-${lessonId}-${uuidv4()}${extension}`;
            contentUrl = `/uploads/lessons/${filename}`;
        }

        // Update lesson with content URL
        const updatedLesson = await prisma.lesson.update({
            where: { id: lessonId },
            data: { contentUrl }
        });

        logger.info(`Content uploaded for lesson: ${lesson.title}`);

        res.json({
            success: true,
            message: 'Content uploaded successfully',
            contentUrl
        });

    } catch (error) {
        logger.error('Upload lesson content error:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: 'Failed to upload lesson content'
        });
    }
}));

// =================================================================
// HELPER FUNCTIONS
// =================================================================

async function updateModuleProgress(studentId: string, moduleId: string): Promise<void> {
    try {
        // Get all lessons in the module
        const lessons = await prisma.lesson.findMany({
            where: { moduleId, isPublished: true },
            include: {
                studentProgress: {
                    where: { studentId }
                }
            }
        });

        // Calculate module completion
        const completedLessons = lessons.filter(lesson => 
            lesson.studentProgress.length > 0 && lesson.studentProgress[0].status === 'completed'
        );

        const completionPercentage = lessons.length > 0 
            ? Math.round((completedLessons.length / lessons.length) * 100)
            : 0;

        const status = completionPercentage === 100 ? 'completed' : 
                      completionPercentage > 0 ? 'in_progress' : 'not_started';

        // Update or create module progress
        await prisma.studentModuleProgress.upsert({
            where: {
                studentId_moduleId: {
                    studentId,
                    moduleId
                }
            },
            update: {
                completionPercentage,
                status,
                lastAccessedAt: new Date(),
                ...(status === 'completed' && { completedAt: new Date() })
            },
            create: {
                studentId,
                moduleId,
                completionPercentage,
                status,
                startedAt: new Date(),
                lastAccessedAt: new Date(),
                ...(status === 'completed' && { completedAt: new Date() })
            }
        });

        logger.debug(`Module progress updated: ${moduleId} for student ${studentId} - ${completionPercentage}%`);
    } catch (error) {
        logger.error('Update module progress error:', error);
    }
}

export { router as lessonsRoutes };