const path = require('path');
const crypto = require('crypto');
const fsExtra = require('fs-extra');
const walkDir = require('./walk_dir');

/**
 * Generate files project.manifest and version.manifest in the build dest res directory.
 * @param { string } dirProject Project directory
 * @param { string } dirBuildDest Build directory
 * @param { object } [options] 选项
 * @param { string } [options.remoteURL] URL of root of remote assets
 * @param { string } [options.version] Version of project
 */
function generate(dirProject, dirBuildDest, options) {
    var remoteURL = '';
    var version = '';
    const manifest = {
        packageUrl: '',
        remoteManifestUrl: '',
        remoteVersionUrl: '',
        version: '',
        assets: {},
        // searchPaths: [],
    };
    var filePaths = [];
    return Promise.resolve()
    .then(() => {
        remoteURL = options && options.remoteURL ? options.remoteURL : null;
        if (! remoteURL) {
            remoteURL = 'http://localhost:8080';
            console.warn(`Remote URL is empty! Set it to ${remoteURL}`);
        }
        version = options && options.version ? options.version : null;
        if (! version) {
            version = "0.0.0";
            console.warn(`Version is empty! Set it to ${version}`);
        }
    })
    // .then(() => {
    //     return fsExtra.readJSON(path.join(dirProject, 'manifest.json'));
    // })
    // .then((manifest) => {
    //     remoteURL = manifest.native.remoteUrl || 'http://localhost:8080';
    // })
    // .then(() => {
    //     return fsExtra.readJSON(path.join(dirProject, 'package.json'));
    // })
    // .then((package) => {
    //     version = package.version;
    // })
    .then(() => {
        manifest.packageUrl = remoteURL;
        manifest.remoteManifestUrl = path.posix.join(remoteURL, 'res/project.manifest');
        manifest.remoteVersionUrl = path.posix.join(remoteURL, 'res/version.manifest');
        manifest.version = version;
    })
    .then(() => {
        return walkDir(path.join(dirBuildDest, 'src'));
    })
    .then((paths) => {
        filePaths = filePaths.concat(paths);
    })
    .then(() => {
        return walkDir(path.join(dirBuildDest, 'res'));
    })
    .then((paths) => {
        filePaths = filePaths.concat(paths);
    })
    .then(() => {
        const assets = manifest.assets;
        /**
         * @type { Promise<void>[] }
         */
        const promises = [];

        filePaths.forEach((filePath) => {
            /**
             * @type { number }
             */
            var size;
            /**
             * @type { string }
             */
            var md5;
            /**
             * @type { string }
             */
            var relative
            promises.push(
                Promise.resolve()
                .then(() => {
                    return fsExtra.readFile(filePath)
                })
                .then((res) => {
                    md5 = crypto.createHash('md5').update(res).digest('hex');
                    size = res.byteLength;
                })
                .then(() => {
                    relative = path.relative(dirBuildDest, filePath);
                    relative = relative.replace(/\\/g, '/');
                })
                .then(() => {
                    assets[relative] = {
                        'size': size,
                        'md5': md5,
                    };
                })
            );
        });

        return Promise.all(promises);
    })
    .then(() => {
        return fsExtra.writeJSON(path.join(dirBuildDest, 'res/project.manifest'), manifest);
    })
    .then(() => {
        delete manifest.assets;
        delete manifest.searchPaths;
        return fsExtra.writeJSON(path.join(dirBuildDest, 'res/version.manifest'), manifest);
    })
    
}

module.exports = generate;