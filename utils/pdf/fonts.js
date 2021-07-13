const path = require('path');
module.exports = {
    Poppins : {
        normal : Buffer.from(require('./vfs_fonts').pdfMake.vfs["Poppins-Regular.ttf"],"base64"),
        bold:  Buffer.from(require('./vfs_fonts').pdfMake.vfs["Poppins-Bold.ttf"],"base64"),
        italics:   Buffer.from(require('./vfs_fonts').pdfMake.vfs["Poppins-Italic.ttf"],"base64"),
        bolditalics:  Buffer.from(require('./vfs_fonts').pdfMake.vfs["Poppins-BoldItalic.ttf"],"base64") 
    }
}
