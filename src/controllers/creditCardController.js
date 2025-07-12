import { creditCard } from "../models/CreditCard.js"

class CreditCardController {

    static async createCardTransaction(req, res) {
        const { bank, date, currency, value, userId } = req.body;
        if (!bank || !date || !currency || !value || !userId) {
            return res.status(400).json({ msg: "All fields are required" });
        }
        try {
            const d = new Date(date);
            const month = d.getUTCMonth();
            const year = d.getUTCFullYear();

            // Busca por banco e mês/ano (ignorando o dia e fuso horário)
            const existingEntry = await creditCard.findOne({
                bank,
                $expr: {
                    $and: [
                        { $eq: [{ $month: "$date" }, month + 1] }, // $month é 1-based
                        { $eq: [{ $year: "$date" }, year] }
                    ]
                }
            });

            if (existingEntry) {
                return res.status(400).json({ msg: "An entry for this bank already exists this month" });
            }

            // Salva a data normalizada
            const newCreditCard = new creditCard({
                bank,
                date,
                currency,
                value,
                userId
            });

            await newCreditCard.save();
            res.status(201).json({ msg: 'New Credit Card Created', data: newCreditCard });
        } catch (error) {
            res.status(500).json({ msg: "Error creating credit card", error: error.message });
        }
    }

    static async getAllCreditCards(req, res) {
        const { id } = req.params;
        try {
            const creditCards = await creditCard.find({ userId: id });
            res.status(200).json(creditCards);
        } catch (error) {
            res.status(500).json({ msg: "Error fetching credit cards", error: error.message });
        }
    }

    static async deleteCreditCard(req, res) {
        const { id } = req.params;
        try {
            const deletedCard = await creditCard.findByIdAndDelete(id);
            if (!deletedCard) {
                return res.status(404).json({ msg: "Credit card not found" });
            }
            res.status(200).json({ msg: "Credit card deleted successfully", data: deletedCard });
        } catch (error) {
            res.status(500).json({ msg: "Error deleting credit card", error: error.message });
        }
    }

}

export default CreditCardController