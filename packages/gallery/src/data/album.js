import { PouchDB, TypeSpec } from '../services/db.js';
import { ImageType } from '../data/image.js';
import { extractID } from '../utils/conversion.js';


class AlbumSpec extends TypeSpec {
    static getUniqueID(doc) {
        return doc.title.trim().replace(/[ \-~!@#$%^&]/g, '_').toLowerCase();
    }

    async findImages(live=false) {
        return await ImageType.find(Object.assign(
            { [`$links.${this._id}`]: {$exists: true} },
            ImageType.selector
        ), live);
    }

    async addImage(image) {
        if (!image.$links[this._id]) {
            await image.update({
                $links: {
                    [this._id]: {
                        sequence: this.count
                    }
                }
            });
            this.count += 1;
            await this.save();
        }
        return image;
    }

    async removeImage(image) {
        if (image.$links[this._id]) {
            delete image.$links[this._id];
            this.count -= 1;
            await image.save();
            await this.save();
        }
        return image;
    }

    async addImageBlob(blob) {
        return await this.addImage(await ImageType.upload(blob));
    }

    async delete(cascade=true) {
        if (cascade) {
            const images = await this.findImages();
            images.map(async i => await this.removeImage(i));
        }
        return await this.update({_deleted: true});
    }

    //
    // static validate(doc) {
    //     // TODO actually validate perhaps against a JSON schema
    //
    //     const schema = {
    //         title: t.REQUIRED_STRING,
    //         createdDate: t.REQUIRED_DATE,
    //         count: t.REQUIRED_INTEGER
    //     };
    // }
}

export const AlbumType = PouchDB.registerType("Album", AlbumSpec);

// ImageType.watch({_deleted: true}, true)
//     .then(la => {
//         la.subscribe() );
//
// image.removed.subscribe(image => {
//     Object.keys(image.tags).forEach(t => index.removeMember(t, image._id));
// })
