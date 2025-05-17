import { encryptedDividends } from "../models/EncryptedDividends.js"

class EncryptedDividendsController {

    static async save(req, res) {
        try {
            const { userId, encryptedData, hash } = req.body

            const newRecord = new encryptedDividends({
                userId,
                encryptedData,
                hash
            })
            await newRecord.insertMany([newRecord], { ordered: false })
            res.status(201).json({ message: "Encrypted dividends saved successfully" })
        } catch (error) {
            console.error("Error saving encrypted dividends:", error)
            res.status(500).json({ message: "Internal server error" })
        }
    }

    static async findByUserId(req, res) {
        try {
            const { userId } = req.params
            const records = await encryptedDividends.find({ userId })
            if (records.length === 0) {
                return res.status(404).json({ message: "No records found for this user" })
            }
            res.status(200).json(records)
        } catch (error) {
            console.error("Error finding encrypted dividends:", error)
            res.status(500).json({ message: "Internal server error" })
        }
    }

    static async deleteByUserId(req, res) {
        try {
            const { userId } = req.params
            const result = await encryptedDividends.deleteMany({ userId })
            if (result.deletedCount === 0) {
                return res.status(404).json({ message: "No records found for this user" })
            }
            res.status(200).json({ message: "Records deleted successfully" })
        } catch (error) {
            console.error("Error deleting encrypted dividends:", error)
            res.status(500).json({ message: "Internal server error" })
        }
    }

}

export default EncryptedDividendsController