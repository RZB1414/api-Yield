import { broker } from "../models/Broker.js"

class BrokerController {

    static async createBroker(req, res) {
        const { brokerName, currency, userId } = req.body
        if (!brokerName || !currency) {
            return res.status(400).send('Broker name and currency are required')
        }
        try {
            const newBroker = new broker({
                broker: brokerName,
                currency: currency,
                userId: userId
            })
            await newBroker.save()
            res.status(201).json(newBroker)
        } catch (error) {
            res.status(500).json({ msg: "Error creating broker", error: error.message })
        }
    }

    static async getBrokers(req, res) {
        try {
            const brokers = await broker.find()
            res.status(200).json(brokers)
        } catch (error) {
            res.status(500).json({ msg: "Error fetching brokers", error: error.message })
        }
    }

    static async getBrokerById(req, res) {
        const { id } = req.params
        if (!id) {
            return res.status(400).send('ID is required')
        }
        try {
            const brokerData = await broker.findById(id)
            if (!brokerData) {
                return res.status(404).send('Broker not found')
            }
            res.status(200).json(brokerData)
        } catch (error) {
            res.status(500).json({ msg: "Error fetching broker data", error: error.message })
        }
    }

}

export default BrokerController