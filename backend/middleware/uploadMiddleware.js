
const multer = require('multer');
const path = require('path');

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
    const extension = path.extname(file.originalname).toLowerCase();

    const allowedMimeTypes = [
        'text/csv',
        'application/vnd.ms-excel',
        'application/csv'
    ];

    if (
        extension === '.csv' &&
        allowedMimeTypes.includes(file.mimetype)
    ) {
        cb(null, true);
    } else {
        cb(new Error('Only valid CSV files are allowed'));
    }
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024,
        files: 1
    }
});

module.exports = upload;
