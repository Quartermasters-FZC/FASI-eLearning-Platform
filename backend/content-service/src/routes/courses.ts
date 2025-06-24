/**
 * Course Management Routes
 * Content Service - AI-Powered eLearning Platform
 * 
 * Comprehensive course creation, management, and discovery
 */

import express from 'express';
import { body, query, validationResult } from 'express-validator';
import asyncHandler from 'express-async-handler';
import { PrismaClient } from '@prisma/client';
import slugify from 'slugify';
import { Client as ElasticClient } from '@elastic/elasticsearch';

import { logger } from '../utils/logger';
import { authMiddleware, requireRole, optionalAuthMiddleware } from '../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();
const elastic = new ElasticClient({ 
    node: process.env.ELASTICSEARCH_URL || 'http://localhost:9200' 
});

// =================================================================
// COURSE DISCOVERY ROUTES
// =================================================================

/**
 * GET /courses
 * Browse and search courses with advanced filtering
 */
router.get('/courses', [
    optionalAuthMiddleware,
    query('page')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Page must be a positive integer'),
    query('limit')
        .optional()
        .isInt({ min: 1, max: 50 })
        .withMessage('Limit must be between 1 and 50'),
    query('search')
        .optional()
        .isLength({ min: 2 })
        .withMessage('Search term must be at least 2 characters'),
    query('language')
        .optional()
        .isUUID()
        .withMessage('Language must be a valid UUID'),
    query('category')
        .optional()
        .isUUID()
        .withMessage('Category must be a valid UUID'),
    query('level')
        .optional()
        .isIn(['beginner', 'intermediate', 'advanced', 'specialized'])
        .withMessage('Invalid level'),
    query('fsiLevel')
        .optional()
        .isFloat({ min: 0, max: 5 })
        .withMessage('FSI level must be between 0 and 5')
], asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            error: 'Validation failed',
            details: errors.array()
        });
    }

    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 20;
        const skip = (page - 1) * limit;
        const { search, language, category, level, fsiLevel, sortBy = 'created', order = 'desc' } = req.query;

        // Build where clause
        const where: any = { isPublished: true };
        
        if (language) where.languageId = language;
        if (category) where.categoryId = category;
        if (level) where.level = level;
        if (fsiLevel) {
            where.fsiLevelMin = { lte: parseFloat(fsiLevel as string) };
            where.fsiLevelMax = { gte: parseFloat(fsiLevel as string) };
        }

        // Text search
        if (search) {
            where.OR = [
                { title: { contains: search as string, mode: 'insensitive' } },
                { description: { contains: search as string, mode: 'insensitive' } },
                { shortDescription: { contains: search as string, mode: 'insensitive' } },
                { tags: { has: search as string } }
            ];
        }

        // Build order by
        let orderBy: any = { createdAt: 'desc' };
        if (sortBy === 'title') orderBy = { title: order };
        else if (sortBy === 'level') orderBy = { fsiLevelMin: order };
        else if (sortBy === 'duration') orderBy = { estimatedHours: order };
        else if (sortBy === 'students') orderBy = { enrollments: { _count: order } };

        // Get courses with related data
        const [courses, totalCourses] = await Promise.all([
            prisma.course.findMany({
                where,
                skip,
                take: limit,
                orderBy,
                include: {
                    language: true,
                    category: true,
                    instructor: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            displayName: true,
                            avatarUrl: true,
                            organization: true
                        }
                    },
                    courseModules: {
                        select: {
                            id: true,
                            title: true,
                            moduleNumber: true,
                            estimatedDurationMinutes: true
                        },
                        orderBy: { moduleNumber: 'asc' }
                    },
                    _count: {
                        select: {
                            enrollments: true,
                            courseModules: true
                        }
                    }
                }
            }),
            prisma.course.count({ where })
        ]);

        // Format courses for response
        const formattedCourses = courses.map(course => ({
            id: course.id,
            title: course.title,
            description: course.description,
            shortDescription: course.shortDescription,
            slug: slugify(course.title, { lower: true }),
            language: {
                id: course.language.id,
                code: course.language.isoCode,
                name: course.language.nameEnglish,
                nativeName: course.language.nameNative,
                scriptType: course.language.scriptType,
                writingDirection: course.language.writingDirection
            },
            category: {
                id: course.category.id,
                name: course.category.name,
                icon: course.category.icon
            },
            instructor: course.instructor,
            level: course.level,
            fsiLevel: {
                min: course.fsiLevelMin,
                max: course.fsiLevelMax
            },
            duration: {
                weeks: course.durationWeeks,
                estimatedHours: course.estimatedHours
            },
            stats: {
                students: course._count.enrollments,
                modules: course._count.courseModules,
                lessons: course.courseModules.reduce((total, module) => total + 1, 0)
            },
            courseImageUrl: course.courseImageUrl,
            courseVideoUrl: course.courseVideoUrl,
            tags: course.tags,
            price: {
                amount: course.price,
                currency: course.currency
            },
            isFeatured: course.isFeatured,
            enrollmentPeriod: {
                start: course.enrollmentStartDate,
                end: course.enrollmentEndDate
            },
            coursePeriod: {
                start: course.courseStartDate,
                end: course.courseEndDate
            },
            createdAt: course.createdAt,
            updatedAt: course.updatedAt
        }));

        const totalPages = Math.ceil(totalCourses / limit);

        res.json({
            success: true,
            courses: formattedCourses,
            pagination: {
                page,
                limit,
                totalCourses,
                totalPages,
                hasNext: page < totalPages,
                hasPrev: page > 1
            },
            filters: {
                search,
                language,
                category,
                level,
                fsiLevel
            }
        });

    } catch (error) {
        logger.error('Browse courses error:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: 'Failed to retrieve courses'
        });
    }
}));

/**
 * GET /courses/featured
 * Get featured courses
 */
router.get('/courses/featured', optionalAuthMiddleware, asyncHandler(async (req, res) => {
    try {
        const featuredCourses = await prisma.course.findMany({
            where: {
                isPublished: true,
                isFeatured: true
            },
            take: 8,
            include: {
                language: true,
                category: true,
                instructor: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        displayName: true,
                        avatarUrl: true
                    }
                },
                _count: {
                    select: {
                        enrollments: true,
                        courseModules: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        const formattedCourses = featuredCourses.map(course => ({
            id: course.id,
            title: course.title,
            shortDescription: course.shortDescription,
            language: {
                code: course.language.isoCode,
                name: course.language.nameEnglish,
                nativeName: course.language.nameNative
            },
            instructor: course.instructor,
            level: course.level,
            fsiLevel: {
                min: course.fsiLevelMin,
                max: course.fsiLevelMax
            },
            stats: {
                students: course._count.enrollments,
                modules: course._count.courseModules
            },
            courseImageUrl: course.courseImageUrl,
            price: {
                amount: course.price,
                currency: course.currency
            }
        }));

        res.json({
            success: true,
            featuredCourses: formattedCourses
        });

    } catch (error) {
        logger.error('Get featured courses error:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: 'Failed to retrieve featured courses'
        });
    }
}));

/**
 * GET /courses/:courseId
 * Get detailed course information
 */
router.get('/courses/:courseId', optionalAuthMiddleware, asyncHandler(async (req, res) => {
    try {
        const { courseId } = req.params;

        const course = await prisma.course.findUnique({
            where: { id: courseId },
            include: {
                language: true,
                category: true,
                instructor: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        displayName: true,
                        avatarUrl: true,
                        organization: true,
                        jobTitle: true
                    }
                },
                courseModules: {
                    include: {
                        lessons: {
                            select: {
                                id: true,
                                title: true,
                                lessonNumber: true,
                                lessonType: true,
                                estimatedDurationMinutes: true,
                                difficultyLevel: true,
                                isPublished: true
                            },
                            orderBy: { lessonNumber: 'asc' }
                        }
                    },
                    orderBy: { moduleNumber: 'asc' }
                },
                _count: {
                    select: {
                        enrollments: true
                    }
                }
            }
        });

        if (!course || !course.isPublished) {
            return res.status(404).json({
                error: 'Course not found',
                message: 'The requested course does not exist or is not published'
            });
        }

        // Check if user is enrolled (if authenticated)
        let isEnrolled = false;
        let enrollmentStatus = null;
        if (req.user) {
            const enrollment = await prisma.courseEnrollment.findUnique({
                where: {
                    studentId_courseId: {
                        studentId: req.user.id,
                        courseId: course.id
                    }
                }
            });
            isEnrolled = !!enrollment;
            enrollmentStatus = enrollment?.status;
        }

        // Calculate total duration and lessons
        const totalLessons = course.courseModules.reduce((total, module) => total + module.lessons.length, 0);
        const totalDurationMinutes = course.courseModules.reduce((total, module) => {
            return total + module.lessons.reduce((moduleTotal, lesson) => {
                return moduleTotal + (lesson.estimatedDurationMinutes || 0);
            }, 0);
        }, 0);

        const detailedCourse = {
            id: course.id,
            title: course.title,
            description: course.description,
            shortDescription: course.shortDescription,
            language: {
                id: course.language.id,
                code: course.language.isoCode,
                name: course.language.nameEnglish,
                nativeName: course.language.nameNative,
                scriptType: course.language.scriptType,
                writingDirection: course.language.writingDirection,
                fsiCategory: course.language.fsiCategory
            },
            category: course.category,
            instructor: course.instructor,
            level: course.level,
            fsiLevel: {
                min: course.fsiLevelMin,
                max: course.fsiLevelMax
            },
            duration: {
                weeks: course.durationWeeks,
                estimatedHours: course.estimatedHours,
                totalMinutes: totalDurationMinutes
            },
            maxStudents: course.maxStudents,
            prerequisites: course.prerequisites,
            learningObjectives: course.learningObjectives,
            courseImageUrl: course.courseImageUrl,
            courseVideoUrl: course.courseVideoUrl,
            syllabusUrl: course.syllabusUrl,
            tags: course.tags,
            price: {
                amount: course.price,
                currency: course.currency
            },
            stats: {
                enrolledStudents: course._count.enrollments,
                totalModules: course.courseModules.length,
                totalLessons,
                totalDurationMinutes
            },
            enrollment: {
                isEnrolled,
                status: enrollmentStatus,
                period: {
                    start: course.enrollmentStartDate,
                    end: course.enrollmentEndDate
                }
            },
            coursePeriod: {
                start: course.courseStartDate,
                end: course.courseEndDate
            },
            modules: course.courseModules.map(module => ({
                id: module.id,
                title: module.title,
                description: module.description,
                moduleNumber: module.moduleNumber,
                estimatedDurationMinutes: module.estimatedDurationMinutes,
                lessons: module.lessons.map(lesson => ({
                    id: lesson.id,
                    title: lesson.title,
                    lessonNumber: lesson.lessonNumber,
                    type: lesson.lessonType,
                    estimatedDurationMinutes: lesson.estimatedDurationMinutes,
                    difficultyLevel: lesson.difficultyLevel,
                    isPublished: lesson.isPublished
                }))
            })),
            createdAt: course.createdAt,
            updatedAt: course.updatedAt
        };

        res.json({
            success: true,
            course: detailedCourse
        });

    } catch (error) {
        logger.error('Get course details error:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: 'Failed to retrieve course details'
        });
    }
}));

// =================================================================
// COURSE MANAGEMENT ROUTES (Instructor/Admin)
// =================================================================

/**
 * POST /courses
 * Create a new course (instructor/admin only)
 */
router.post('/courses', [
    authMiddleware,
    requireRole(['instructor', 'admin', 'super_admin']),
    body('title')
        .isLength({ min: 5, max: 500 })
        .withMessage('Title must be 5-500 characters'),
    body('description')
        .isLength({ min: 50, max: 5000 })
        .withMessage('Description must be 50-5000 characters'),
    body('shortDescription')
        .isLength({ min: 20, max: 1000 })
        .withMessage('Short description must be 20-1000 characters'),
    body('languageId')
        .isUUID()
        .withMessage('Language ID must be a valid UUID'),
    body('categoryId')
        .isUUID()
        .withMessage('Category ID must be a valid UUID'),
    body('level')
        .isIn(['beginner', 'intermediate', 'advanced', 'specialized'])
        .withMessage('Invalid level'),
    body('fsiLevelMin')
        .isFloat({ min: 0, max: 5 })
        .withMessage('FSI minimum level must be between 0 and 5'),
    body('fsiLevelMax')
        .isFloat({ min: 0, max: 5 })
        .withMessage('FSI maximum level must be between 0 and 5')
], asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            error: 'Validation failed',
            details: errors.array()
        });
    }

    try {
        const {
            title,
            description,
            shortDescription,
            languageId,
            categoryId,
            level,
            fsiLevelMin,
            fsiLevelMax,
            durationWeeks,
            estimatedHours,
            maxStudents = 20,
            prerequisites = [],
            learningObjectives = [],
            tags = [],
            price = 0,
            currency = 'USD'
        } = req.body;

        // Validate language and category exist
        const [language, category] = await Promise.all([
            prisma.language.findUnique({ where: { id: languageId } }),
            prisma.courseCategory.findUnique({ where: { id: categoryId } })
        ]);

        if (!language) {
            return res.status(400).json({
                error: 'Invalid language',
                message: 'Language not found'
            });
        }

        if (!category) {
            return res.status(400).json({
                error: 'Invalid category',
                message: 'Category not found'
            });
        }

        // Validate FSI levels
        if (fsiLevelMin > fsiLevelMax) {
            return res.status(400).json({
                error: 'Invalid FSI levels',
                message: 'Minimum FSI level cannot be greater than maximum FSI level'
            });
        }

        // Create course
        const course = await prisma.course.create({
            data: {
                title,
                description,
                shortDescription,
                languageId,
                categoryId,
                instructorId: req.user!.id,
                level,
                fsiLevelMin,
                fsiLevelMax,
                durationWeeks,
                estimatedHours,
                maxStudents,
                prerequisites,
                learningObjectives,
                tags,
                price,
                currency,
                createdBy: req.user!.id
            },
            include: {
                language: true,
                category: true,
                instructor: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        displayName: true
                    }
                }
            }
        });

        // Index course in Elasticsearch for search
        try {
            await elastic.index({
                index: 'courses',
                id: course.id,
                body: {
                    title: course.title,
                    description: course.description,
                    shortDescription: course.shortDescription,
                    language: {
                        code: language.isoCode,
                        name: language.nameEnglish,
                        nativeName: language.nameNative
                    },
                    category: category.name,
                    level: course.level,
                    fsiLevelMin: course.fsiLevelMin,
                    fsiLevelMax: course.fsiLevelMax,
                    tags: course.tags,
                    instructor: course.instructor.displayName,
                    isPublished: course.isPublished,
                    createdAt: course.createdAt
                }
            });
        } catch (elasticError) {
            logger.warn('Failed to index course in Elasticsearch:', elasticError);
        }

        logger.info(`Course created: ${course.title} by ${req.user!.email}`);

        res.status(201).json({
            success: true,
            message: 'Course created successfully',
            course: {
                id: course.id,
                title: course.title,
                language: course.language,
                category: course.category,
                instructor: course.instructor,
                level: course.level,
                fsiLevel: {
                    min: course.fsiLevelMin,
                    max: course.fsiLevelMax
                },
                isPublished: course.isPublished
            }
        });

    } catch (error) {
        logger.error('Create course error:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: 'Failed to create course'
        });
    }
}));

export { router as coursesRoutes };