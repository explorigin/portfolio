import { PouchDB, TypeSpec } from '../services/db.js';
import { log } from '../services/console.js';


class AlbumSpec extends TypeSpec {
    static getUniqueID(doc) {
        return doc.title.trim().replace(/[ \-~!@#$%^&]/g, '_').toLowerCase();
    }

    async addMember(member, position) {
        const currentPosition = this.members.indexOf(member);
        const newPosition = position ? position : this.members.length;
        if (currentPosition !== -1) {
            this.members.splice(currentPosition, 1);
        }
        this.members.splice(newPosition, 0, member);
        await this.save();
    }

    async removeMember(member) {
        const currentPosition = this.members.indexOf(member);

        if (currentPosition !== -1) {
            this.members.splice(currentPosition, 1);
            await this.save();
        }
    }

    //
    // static validate(doc) {
    //     // TODO actually validate perhaps against a JSON schema
    //
    //     const schema = {
    //         title: t.REQUIRED_STRING,
    //         members: {
    //             type: "array",
    //             items: t.STRING
    //         }
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
