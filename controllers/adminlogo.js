

const AdminLogo = require("../models/adminlogos")

async function handleAdminLogoPost(req, res) {
    try {
        const name = req.body.name;
        const image = req.file.filename;
        console.log(image);
        console.log(req.body);
        const adminlogo = new AdminLogo({
            name: name,
            image: image
        })
        await adminlogo.save();
        return res.status(200).json({ msg: "admin logo created", adminlogo });
    } catch (error) {
        console.log(error);
        const errmsg = error.message;
        return res.json({ msg: "Internal Server Error", errmsg })
    }

}

async function handleUpdateAdminLogo(req, res) {
    try {
        const id = req.params.id;
        const image = req.file.filename;

        const data = await AdminLogo.findByIdAndUpdate(id, { image: image }, { new: true });

        if (!data) {
            return res.status(404).json({ msg: "Logo not found" });
        }
        console.log({ data })

        // Convert the Mongoose document to a plain JavaScript object
        const jsonData = data.toJSON();

        console.log({ id, image });
        console.log(jsonData);

        res.json({ msg: "Logo Updated", data: jsonData });
    } catch (error) {
        console.log(error);
        const errmsg = error.message;
        return res.json({ msg: "Internal Server Error", errmsg });
    }
}

async function getLogoById(req, res) {
    try {
        const id = req.params.id;
        const logo = await AdminLogo.findById({ _id: id });

        return res.json(logo)
    } catch (error) {
        console.log(error);
        const errmsg = error.message;
        return res.json({ msg: "Internal Server Error", errmsg });
    }
}

module.exports = {
    handleAdminLogoPost,
    handleUpdateAdminLogo,
    getLogoById
}