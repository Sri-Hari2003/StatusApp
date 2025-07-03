// Mock data for services and incidents

export const mockServices = [
    {
        id: 1,
        name: "Website",
        description: "Main landing page",
        status: "operational",
        uptime: "99.95%",
        link: "https://website.example.com"
    },
    {
        id: 2,
        name: "API",
        description: "Public REST API",
        status: "partial_outage",
        uptime: "97.10%",
        link: "https://api.example.com"
    },
    {
        id: 3,
        name: "Database",
        description: "PostgreSQL cluster",
        status: "degraded_performance",
        uptime: "98.23%",
        link: ""
    }
];

export const mockIncidentTimeline = [
    {
        id: 2,
        title: "API Gateway Outage",
        status: "investigating",
        created_at: "2025-06-30T09:00:00Z",
        serviceId: 2,
        updates: [
            {
                message: "We are investigating reports of downtime for the API gateway.",
                status: "investigating",
                timestamp: "2025-07-01T10:00:00Z"
            }
        ]
    },
    {
        id: 1,
        title: "Our monkeys aren't performing",
        status: "resolved",
        created_at: "2025-07-01T10:00:00Z",
        serviceId: 1,
        updates: [
            {
                message: "We're investigating an issue with our monkeys not performing as they should be.",
                status: "investigating",
                timestamp: "2025-07-01T10:10:00Z"
            },
            {
                message: "We have identified the issue with our lovely performing monkeys.",
                status: "identified",
                timestamp: "2025-07-01T10:30:00Z"
            },
            {
                message: "Our monkeys need a break from performing. They'll be back after a good rest.",
                status: "monitoring",
                timestamp: "2025-07-01T10:45:00Z"
            },
            {
                message: "The monkeys are back and rested!",
                status: "resolved",
                timestamp: "2025-07-01T11:00:00Z"
            }
        ]
    },
    {
        id: 3,
        title: "Database Latency Spike",
        status: "monitoring",
        created_at: "2025-07-02T08:00:00Z",
        serviceId: 3,
        updates: [
            {
                message: "We are seeing increased latency in the database.",
                status: "investigating",
                timestamp: "2025-07-02T08:10:00Z"
            },
            {
                message: "Latency is decreasing, monitoring ongoing.",
                status: "monitoring",
                timestamp: "2025-07-02T08:30:00Z"
            }
        ]
    },
    {
        id: 4,
        title: "Login Service Down",
        status: "identified",
        created_at: "2025-07-03T12:00:00Z",
        serviceId: 1,
        updates: [
            {
                message: "Login service is currently unavailable.",
                status: "investigating",
                timestamp: "2025-07-03T12:05:00Z"
            },
            {
                message: "Root cause identified: database connection issue.",
                status: "identified",
                timestamp: "2025-07-03T12:20:00Z"
            }
        ]
    },
    {
        id: 5,
        title: "Email Delivery Delays",
        status: "resolved",
        created_at: "2025-07-04T15:00:00Z",
        serviceId: 2,
        updates: [
            {
                message: "Some users are experiencing email delivery delays.",
                status: "investigating",
                timestamp: "2025-07-04T15:10:00Z"
            },
            {
                message: "Issue resolved. All emails are being delivered normally.",
                status: "resolved",
                timestamp: "2025-07-04T15:40:00Z"
            }
        ]
    },
    {
        id: 6,
        title: "Cache Server Restart",
        status: "resolved",
        created_at: "2025-07-05T09:00:00Z",
        serviceId: 3,
        updates: [
            {
                message: "Cache server was restarted for maintenance.",
                status: "resolved",
                timestamp: "2025-07-05T09:10:00Z"
            }
        ]
    },
    {
        id: 7,
        title: "Payment Gateway Timeout",
        status: "investigating",
        created_at: "2025-07-06T11:00:00Z",
        serviceId: 2,
        updates: [
            {
                message: "Timeouts reported on payment gateway.",
                status: "investigating",
                timestamp: "2025-07-06T11:05:00Z"
            }
        ]
    },
    {
        id: 8,
        title: "API Gateway Outage",
        status: "investigating",
        created_at: "2025-06-30T09:00:00Z",
        serviceId: 2,
        updates: [
            {
                message: "We are investigating reports of downtime for the API gateway.",
                status: "investigating",
                timestamp: "2025-06-30T09:15:00Z"
            }
        ]
    },
    {
        id: 9,
        title: "User Profile Sync Issue",
        status: "monitoring",
        created_at: "2025-07-07T14:00:00Z",
        serviceId: 1,
        updates: [
            {
                message: "User profile sync is delayed for some users.",
                status: "investigating",
                timestamp: "2025-07-07T14:10:00Z"
            },
            {
                message: "Sync is catching up, monitoring ongoing.",
                status: "monitoring",
                timestamp: "2025-07-07T14:30:00Z"
            }
        ]
    },
    {
        id: 10,
        title: "Analytics Dashboard Lag",
        status: "identified",
        created_at: "2025-07-08T10:00:00Z",
        serviceId: 2,
        updates: [
            {
                message: "Analytics dashboard is slow to load.",
                status: "investigating",
                timestamp: "2025-07-08T10:05:00Z"
            },
            {
                message: "Issue identified: heavy query load.",
                status: "identified",
                timestamp: "2025-07-08T10:20:00Z"
            }
        ]
    },
    {
        id: 11,
        title: "DNS Outage",
        status: "resolved",
        created_at: "2025-07-09T07:00:00Z",
        serviceId: 1,
        updates: [
            {
                message: "DNS resolution failed for some users.",
                status: "investigating",
                timestamp: "2025-07-09T07:10:00Z"
            },
            {
                message: "Issue resolved. DNS is now operational.",
                status: "resolved",
                timestamp: "2025-07-09T07:40:00Z"
            }
        ]
    },
    {
        id: 12,
        title: "Mobile App Crash",
        status: "resolved",
        created_at: "2025-07-10T13:00:00Z",
        serviceId: 1,
        updates: [
            {
                message: "Crash reports received from mobile app users.",
                status: "investigating",
                timestamp: "2025-07-10T13:05:00Z"
            },
            {
                message: "Bug fix deployed. App is stable now.",
                status: "resolved",
                timestamp: "2025-07-10T13:30:00Z"
            }
        ]
    },
    {
        id: 13,
        title: "File Upload Issue",
        status: "resolved",
        created_at: "2025-07-11T16:00:00Z",
        serviceId: 2,
        updates: [
            {
                message: "Users unable to upload files.",
                status: "investigating",
                timestamp: "2025-07-11T16:10:00Z"
            },
            {
                message: "Service restored. File uploads working.",
                status: "resolved",
                timestamp: "2025-07-11T16:40:00Z"
            }
        ]
    }
]; 