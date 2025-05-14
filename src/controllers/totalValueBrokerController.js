import { totalValueBroker } from "../models/TotalValueBoker.js"

class TotalValueBrokerController {

    static async createTotalValueBroker(req, res) {
        const { date, currency, totalValueInUSD, totalValueInBRL, broker } = req.body
        if (!date || !currency || !totalValueInUSD || !totalValueInBRL || !broker) {
            return res.status(200).json({ msg: "All fields are required"})
        }
        try {
            // Calcula o início e o fim do mês da data fornecida
            const startOfMonth = new Date(new Date(date).getFullYear(), new Date(date).getMonth(), 1);
            const endOfMonth = new Date(new Date(date).getFullYear(), new Date(date).getMonth() + 1, 0);

            // Verifica se já existe uma entrada para o mesmo corretor no mesmo mês
            const existingEntry = await totalValueBroker.findOne({
                broker: broker,
                date: { $gte: startOfMonth, $lte: endOfMonth }
            });

            if (existingEntry) {
                return res.status(200).json({ msg: "An entry for this broker already exists this month" });
            }

            // Cria uma nova entrada se não houver conflito
            const newTotalValueBroker = new totalValueBroker({
                date,
                currency,
                totalValueInUSD,
                totalValueInBRL,
                broker
            })
            await newTotalValueBroker.save()
            res.status(201).json({ message: 'New Total Value Created ', data: newTotalValueBroker })
        } catch (error) {
            res.status(500).json({ msg: "Error creating total value broker", error: error.message })
        }
    }

    static async getAllTotalValueBrokers(req, res) {
        try {
            const totalValueBrokers = await totalValueBroker.find()
            res.status(200).json(totalValueBrokers)
        } catch (error) {
            res.status(500).json({ msg: "Error fetching total value brokers", error: error.message })
        }
    }

    static async getTotalValueBrokerById(req, res) {
        const { id } = req.params
        if (!id) {
            return res.status(400).send('ID is required')
        }
        try {
            const totalValueBrokerData = await totalValueBroker.findById(id)
            if (!totalValueBrokerData) {
                return res.status(404).send('Total value broker not found')
            }
            res.status(200).json('Total Value ', totalValueBrokerData)
        } catch (error) {
            res.status(500).json({ msg: "Error fetching total value broker data", error: error.message })
        }
    }

        static async updateTotalValueBroker(req, res) {
        const { broker, monthIndex, type, newValue } = req.body;
    
        if (!broker || monthIndex === undefined || !type || newValue === undefined) {
            return res.status(400).json({ msg: "All fields (broker, monthIndex, type, newValue) are required" });
        }
    
        try {
            // Calcula o início e o fim do mês com base no monthIndex
            const currentYear = new Date().getFullYear();
            const startOfMonth = new Date(currentYear, monthIndex, 1);
            const endOfMonth = new Date(currentYear, monthIndex + 1, 0);
    
            // Encontra a entrada correspondente no banco de dados
            const totalValueBrokerEntry = await totalValueBroker.findOne({
                broker: broker,
                date: { $gte: startOfMonth, $lte: endOfMonth }
            });
    
            if (!totalValueBrokerEntry) {
                return res.status(404).json({ msg: "Total value broker entry not found for the specified month and broker" });
            }
    
            // Atualiza o campo correspondente (type pode ser "totalValueInUSD" ou "totalValueInBRL")
            if (type === "totalValueInUSD") {
                totalValueBrokerEntry.totalValueInUSD = newValue;
            } else if (type === "totalValueInBRL") {
                totalValueBrokerEntry.totalValueInBRL = newValue;
            } else {
                return res.status(400).json({ msg: "Invalid type. Must be 'totalValueInUSD' or 'totalValueInBRL'" });
            }
    
            // Salva as alterações no banco de dados
            await totalValueBrokerEntry.save();
    
            res.status(200).json({ msg: "Total value broker updated successfully", data: totalValueBrokerEntry });
        } catch (error) {
            res.status(500).json({ msg: "Error updating total value broker", error: error.message });
        }
    }

    static async deleteTotalValueBroker(req, res) {
        const { id } = req.params
        if (!id) {
            return res.status(400).send('ID is required')
        }
        try {
            const deletedTotalValueBroker = await totalValueBroker.findByIdAndDelete(id)
            if (!deletedTotalValueBroker) {
                return res.status(404).send('Total value broker not found')
            }
            res.status(200).json({ message: 'Total value broker deleted', data: deletedTotalValueBroker })
        } catch (error) {
            res.status(500).json({ msg: "Error deleting total value broker", error: error.message })
        }
    }

}

export default TotalValueBrokerController