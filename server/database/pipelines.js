const pipelines = {

    userAndProviderDataAggregation: [
        {
            '$lookup': {
                'from': 'users',
                'localField': 'serviceUserUuid',
                'foreignField': 'uuid',
                'pipeline': [{'$project': {'fullName': 1, 'phone': 1}}],
                'as': 'rider',
            }
        },
        {
            '$lookup': {
                'from': 'service-providers',
                'localField': 'driverUuid',
                'foreignField': 'uuid',
                'pipeline': [{'$project': {'fullName': 1, 'mobilePhone': 1}}],
                'as': 'driver'
            }
        }
    ],

    projectVehicleNameUuiAndFleetId: [
        {
            '$project': {
                'displayName': 1,
                'uuid': 1,
                'fleetId': 1
            }
        }
    ],

    projectUserNameUuidAndPhone: [
        {
            '$project': {
                'fullName': 1,
                'uuid': 1,
                'phone': 1
            }
        }
    ],

    projectProviderNameUuidAndPhone: [
        {
            '$project': {
                'fullName': 1,
                'uuid': 1,
                'mobilePhone': 1
            }
        }
    ]
}

const pipelineGenerators = {

    projectFields: (fieldNames) => {
        const projectObject = fieldNames.reduce((acc, fieldName) => {
            acc[fieldName] = 1;
            return acc;
        }, {});
        return {
            '$project': projectObject
        };
    },

    fuzzySearch: (indexField, searchTerm) => [
        // Using regular text search instead of Atlas Search (compatible with free tier M0)
        // This searches across all text fields in the document
        {
            $match: {
                $or: [
                    { fullName: { $regex: searchTerm, $options: 'i' } },
                    { displayName: { $regex: searchTerm, $options: 'i' } },
                    { phone: { $regex: searchTerm, $options: 'i' } },
                    { mobilePhone: { $regex: searchTerm, $options: 'i' } },
                    { fleetId: { $regex: searchTerm, $options: 'i' } }
                ]
            }
        }
        
        /* Original Atlas Search - requires paid tier
        {
            $search: {
                "index": indexField,
                "text": {
                    "path": {
                        wildcard: "*"
                    },
                    "query": searchTerm,
                    "fuzzy": {}
                }
            }
        }
        */
    ],

    matchUuid: (uuid) => [
        {
            '$match' : {
                'uuid' : uuid
            }
        }
    ]
}

module.exports = {pipelines, pipelineGenerators};