const pipelines = {

    userAndProviderDataAggregation: [
        {
            '$lookup': {
                'from': 'users',
                'localField': 'serviceUserUuid',
                'foreignField': 'uuid',
                'as': 'rider'
            }
        },
        {
            // If rider lookup returns empty (user not in DB), create synthetic rider from embedded fields
            '$addFields': {
                'rider': {
                    '$cond': {
                        'if': { '$eq': [{ '$size': '$rider' }, 0] },
                        'then': [{
                            'fullName': { '$ifNull': ['$serviceUserName', 'Unknown'] },
                            'phone': { '$ifNull': ['$serviceUserPhone', 'N/A'] },
                            'uuid': '$serviceUserUuid'
                        }],
                        'else': '$rider'
                    }
                }
            }
        },
        {
            '$lookup': {
                'from': 'service-providers',
                'localField': 'assignedDriverUuid',
                'foreignField': 'uuid',
                'as': 'driver'
            }
        },
        {
            '$lookup': {
                'from': 'vehicles',
                'localField': 'assignedVehicleUuid',
                'foreignField': 'uuid',
                'as': 'vehicle'
            }
        },
        {
            '$lookup': {
                'from': 'system-users',
                'localField': 'createdByUuid',
                'foreignField': 'uuid',
                'as': 'createdBy'
            }
        },
        {
            // Flatten createdBy array to single object (or null if not found)
            '$addFields': {
                'createdBy': {
                    '$cond': {
                        'if': { '$gt': [{ '$size': '$createdBy' }, 0] },
                        'then': { '$arrayElemAt': ['$createdBy', 0] },
                        'else': null
                    }
                }
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