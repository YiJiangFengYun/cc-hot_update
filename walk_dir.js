const fs = require('fs');
const path = require('path');

/**
 * 
 * @param {string} dir
 * @returns { Promise<string[]> } 
 */
function walkDir(dir) {
    return new Promise((resolve, reject) => {
        var results = [];
        fs.readdir(dir, function (err, list) {
            if (err) return reject(err);
            var i = 0;
            (function next() {
                var file = list[i++];
                if (!file) return resolve(results);
                file = path.join(dir, file);
                fs.stat(file, function (err, stat) {
                    if (stat && stat.isDirectory()) {
                        walkDir(file).then((res) => {
                            results = results.concat(res);
                            next();
                        }, reject);
                    } else {
                        results.push(file);
                        next();
                    }
                });
            })();
        });
    });

};

module.exports = walkDir;