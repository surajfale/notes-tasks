const Link = require('../models/Link');
const List = require('../models/List');
const axios = require('axios');
const cheerio = require('cheerio');
const { AppError } = require('../middleware/errorHandler');

// Helper to fetch metadata
async function fetchMetadata(url) {
    try {
        const response = await axios.get(url, {
            timeout: 5000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; NotesTasksBot/1.0; +http://localhost:3000)'
            }
        });

        const html = response.data;
        const $ = cheerio.load(html);

        const title = $('meta[property="og:title"]').attr('content') || $('title').text() || '';
        const description = $('meta[property="og:description"]').attr('content') || $('meta[name="description"]').attr('content') || '';
        const image = $('meta[property="og:image"]').attr('content') || '';
        const siteName = $('meta[property="og:site_name"]').attr('content') || '';

        return { title, description, image, siteName };
    } catch (error) {
        console.error('Error fetching metadata:', error.message);
        return {};
    }
}

// @desc    Get all links
// @route   GET /api/links
// @access  Private
exports.getLinks = async (req, res, next) => {
    try {
        const { listId, isArchived, tags, search } = req.query;

        const query = { userId: req.user._id };

        // Filter by list
        if (listId) {
            query.listId = listId;
        }

        // Filter by archived status
        if (isArchived !== undefined) {
            query.isArchived = isArchived === 'true';
        } else {
            // Default: don't show archived unless specifically requested
            query.isArchived = false;
        }

        // Filter by tags
        if (tags) {
            const tagList = tags.split(',');
            query.tags = { $all: tagList };
        }

        // Search
        if (search) {
            query.$or = [
                { title: { $regex: search, $options: 'i' } },
                { url: { $regex: search, $options: 'i' } },
                { tags: { $in: [new RegExp(search, 'i')] } }
            ];
        }

        const links = await Link.find(query).sort({ updatedAt: -1 });

        res.json(links);
    } catch (error) {
        next(error);
    }
};

// @desc    Get single link
// @route   GET /api/links/:id
// @access  Private
exports.getLink = async (req, res, next) => {
    try {
        const link = await Link.findOne({
            _id: req.params.id,
            userId: req.user._id,
        });

        if (!link) {
            return next(new AppError('Link not found', 404));
        }

        res.json(link);
    } catch (error) {
        next(error);
    }
};

// @desc    Create new link
// @route   POST /api/links
// @access  Private
exports.createLink = async (req, res, next) => {
    try {
        const { title, url, tags, listId } = req.body;

        // Validate list ownership if provided
        if (listId) {
            const list = await List.findOne({
                _id: listId,
                userId: req.user._id,
            });

            if (!list) {
                return next(new AppError('List not found', 404));
            }
        }

        // Fetch metadata
        const metadata = await fetchMetadata(url);

        const link = await Link.create({
            userId: req.user._id,
            listId: listId || undefined,
            title: title || metadata.title || url,
            url,
            tags,
            description: metadata.description,
            image: metadata.image,
            siteName: metadata.siteName
        });

        res.status(201).json(link);
    } catch (error) {
        next(error);
    }
};

// @desc    Update link
// @route   PUT /api/links/:id
// @access  Private
exports.updateLink = async (req, res, next) => {
    try {
        const { title, url, tags, listId, isArchived } = req.body;

        let link = await Link.findOne({
            _id: req.params.id,
            userId: req.user._id,
        });

        if (!link) {
            return next(new AppError('Link not found', 404));
        }

        // Validate list ownership if changing list
        if (listId && listId !== link.listId?.toString()) {
            const list = await List.findOne({
                _id: listId,
                userId: req.user._id,
            });

            if (!list) {
                return next(new AppError('List not found', 404));
            }
        }

        // If URL changed, fetch new metadata
        if (url && url !== link.url) {
            const metadata = await fetchMetadata(url);
            link.description = metadata.description || link.description;
            link.image = metadata.image || link.image;
            link.siteName = metadata.siteName || link.siteName;
            // Only update title if user didn't provide one explicitly in this update
            if (!title && metadata.title) {
                link.title = metadata.title;
            }
        }

        // Update fields
        if (title !== undefined) link.title = title;
        if (url !== undefined) link.url = url;
        if (tags !== undefined) link.tags = tags;
        if (listId !== undefined) link.listId = listId;
        if (isArchived !== undefined) link.isArchived = isArchived;

        await link.save();

        res.json(link);
    } catch (error) {
        next(error);
    }
};

// @desc    Delete link
// @route   DELETE /api/links/:id
// @access  Private
exports.deleteLink = async (req, res, next) => {
    try {
        const link = await Link.findOneAndDelete({
            _id: req.params.id,
            userId: req.user._id,
        });

        if (!link) {
            return next(new AppError('Link not found', 404));
        }

        res.json({ message: 'Link removed' });
    } catch (error) {
        next(error);
    }
};
