// // Mock data for services and incidents

// // Helper function to get data filtered by organization
// export const getServicesByOrg = (orgId: string) => {
//   return mockServices.filter(service => service.orgId === orgId);
// };

// export const getIncidentsByOrg = (orgId: string) => {
//   return mockIncidentTimeline.filter(incident => incident.orgId === orgId);
// };

// export const mockServices = [
//     {
//         id: 1,
//         orgId: "org_2zS1qQOPMTPdUwxaHVygk2CxgE7",
//         name: "Website",
//         description: "Main landing page",
//         status: "operational",
//         uptime: "99.95%",
//         link: "https://website.example.com"
//     },
//     {
//         id: 2,
//         orgId: "org_2zS1qQOPMTPdUwxaHVygk2CxgE7",
//         name: "API",
//         description: "Public REST API",
//         status: "partial_outage",
//         uptime: "97.10%",
//         link: "https://api.example.com"
//     },
//     {
//         id: 3,
//         orgId: "org_2zS1qQOPMTPdUwxaHVygk2CxgE7",
//         name: "Database",
//         description: "PostgreSQL cluster",
//         status: "degraded_performance",
//         uptime: "98.23%",
//         link: ""
//     },
//     {
//         id: 4,
//         orgId: "org_2zS1qQOPMTPdUwxaHVygk2CxgE7",
//         name: "Mobile App",
//         description: "iOS and Android applications",
//         status: "operational",
//         uptime: "99.98%",
//         link: "https://mobile.example.com"
//     },
//     {
//         id: 5,
//         orgId: "org_2zS1qQOPMTPdUwxaHVygk2CxgE7",
//         name: "Payment Gateway",
//         description: "Payment processing service",
//         status: "under_maintenance",
//         uptime: "99.99%",
//         link: "https://payments.example.com"
//     },
//     {
//         id: 6,
//         orgId: "org_2zS1qQOPMTPdUwxaHVygk2CxgE7",
//         name: "Email Service",
//         description: "Transactional email delivery",
//         status: "degraded_performance",
//         uptime: "96.45%",
//         link: "https://email.example.com"
//     }
// ];

// export const mockIncidentTimeline = [
//     {
//         id: 2,
//         orgId: "org_2zS1qQOPMTPdUwxaHVygk2CxgE7",
//         title: "API Gateway Outage",
//         status: "investigating",
//         created_at: "2025-06-30T09:00:00Z",
//         serviceId: 2,
//         updates: [
//             {
//                 message: "We are investigating reports of downtime for the API gateway.",
//                 status: "investigating",
//                 timestamp: "2025-06-30T09:00:00Z"
//             }
//         ]
//     },
//     {
//         id: 1,
//         orgId: "org_2zS1qQOPMTPdUwxaHVygk2CxgE7",
//         title: "Our monkeys aren't performing",
//         status: "resolved",
//         created_at: "2025-07-01T10:00:00Z",
//         serviceId: 1,
//         updates: [
//             {
//                 message: "We're investigating an issue with our monkeys not performing as they should be.",
//                 status: "investigating",
//                 timestamp: "2025-07-01T10:10:00Z"
//             },
//             {
//                 message: "We have identified the issue with our lovely performing monkeys.",
//                 status: "identified",
//                 timestamp: "2025-07-01T10:30:00Z"
//             },
//             {
//                 message: "Our monkeys need a break from performing. They'll be back after a good rest.",
//                 status: "monitoring",
//                 timestamp: "2025-07-01T10:45:00Z"
//             },
//             {
//                 message: "The monkeys are back and rested!",
//                 status: "resolved",
//                 timestamp: "2025-07-01T11:00:00Z"
//             }
//         ]
//     },
//     {
//         id: 3,
//         orgId: "org_2zS1qQOPMTPdUwxaHVygk2CxgE7",
//         title: "Database Latency Spike",
//         status: "monitoring",
//         created_at: "2025-07-02T08:00:00Z",
//         serviceId: 3,
//         updates: [
//             {
//                 message: "We are seeing increased latency in the database.",
//                 status: "investigating",
//                 timestamp: "2025-07-02T08:10:00Z"
//             },
//             {
//                 message: "Latency is decreasing, monitoring ongoing.",
//                 status: "monitoring",
//                 timestamp: "2025-07-02T08:30:00Z"
//             }
//         ]
//     },
//     {
//         id: 4,
//         orgId: "org_2zS1qQOPMTPdUwxaHVygk2CxgE7",
//         title: "Login Service Down",
//         status: "identified",
//         created_at: "2025-07-03T12:00:00Z",
//         serviceId: 1,
//         updates: [
//             {
//                 message: "Login service is currently unavailable.",
//                 status: "investigating",
//                 timestamp: "2025-07-03T12:05:00Z"
//             },
//             {
//                 message: "Root cause identified: database connection issue.",
//                 status: "identified",
//                 timestamp: "2025-07-03T12:20:00Z"
//             }
//         ]
//     },
//     {
//         id: 5,
//         orgId: "org_2zS1qQOPMTPdUwxaHVygk2CxgE7",
//         title: "Email Delivery Delays",
//         status: "resolved",
//         created_at: "2025-07-04T15:00:00Z",
//         serviceId: 2,
//         updates: [
//             {
//                 message: "Some users are experiencing email delivery delays.",
//                 status: "investigating",
//                 timestamp: "2025-07-04T15:10:00Z"
//             },
//             {
//                 message: "Issue resolved. All emails are being delivered normally.",
//                 status: "resolved",
//                 timestamp: "2025-07-04T15:40:00Z"
//             }
//         ]
//     },
//     {
//         id: 6,
//         orgId: "org_2zS1qQOPMTPdUwxaHVygk2CxgE7",
//         title: "Cache Server Restart",
//         status: "resolved",
//         created_at: "2025-07-05T09:00:00Z",
//         serviceId: 3,
//         updates: [
//             {
//                 message: "Cache server was restarted for maintenance.",
//                 status: "resolved",
//                 timestamp: "2025-07-05T09:10:00Z"
//             }
//         ]
//     },
//     {
//         id: 7,
//         orgId: "org_2zS1qQOPMTPdUwxaHVygk2CxgE7",
//         title: "Payment Gateway Timeout",
//         status: "investigating",
//         created_at: "2025-07-06T11:00:00Z",
//         serviceId: 2,
//         updates: [
//             {
//                 message: "Timeouts reported on payment gateway.",
//                 status: "investigating",
//                 timestamp: "2025-07-06T11:05:00Z"
//             }
//         ]
//     },
//     {
//         id: 8,
//         orgId: "org_2zS1qQOPMTPdUwxaHVygk2CxgE7",
//         title: "API Gateway Outage",
//         status: "investigating",
//         created_at: "2025-06-30T09:00:00Z",
//         serviceId: 2,
//         updates: [
//             {
//                 message: "We are investigating reports of downtime for the API gateway.",
//                 status: "investigating",
//                 timestamp: "2025-06-30T09:15:00Z"
//             }
//         ]
//     },
//     {
//         id: 9,
//         orgId: "org_2zS1qQOPMTPdUwxaHVygk2CxgE7",
//         title: "User Profile Sync Issue",
//         status: "monitoring",
//         created_at: "2025-07-07T14:00:00Z",
//         serviceId: 1,
//         updates: [
//             {
//                 message: "User profile sync is delayed for some users.",
//                 status: "investigating",
//                 timestamp: "2025-07-07T14:10:00Z"
//             },
//             {
//                 message: "Sync is catching up, monitoring ongoing.",
//                 status: "monitoring",
//                 timestamp: "2025-07-07T14:30:00Z"
//             }
//         ]
//     },
//     {
//         id: 10,
//         orgId: "org_2zS1qQOPMTPdUwxaHVygk2CxgE7",
//         title: "Analytics Dashboard Lag",
//         status: "identified",
//         created_at: "2025-07-08T10:00:00Z",
//         serviceId: 2,
//         updates: [
//             {
//                 message: "Analytics dashboard is slow to load.",
//                 status: "investigating",
//                 timestamp: "2025-07-08T10:05:00Z"
//             },
//             {
//                 message: "Issue identified: heavy query load.",
//                 status: "identified",
//                 timestamp: "2025-07-08T10:20:00Z"
//             }
//         ]
//     },
//     {
//         id: 11,
//         orgId: "org_2zS1qQOPMTPdUwxaHVygk2CxgE7",
//         title: "DNS Outage",
//         status: "resolved",
//         created_at: "2025-07-09T07:00:00Z",
//         serviceId: 1,
//         updates: [
//             {
//                 message: "DNS resolution failed for some users.",
//                 status: "investigating",
//                 timestamp: "2025-07-09T07:10:00Z"
//             },
//             {
//                 message: "Issue resolved. DNS is now operational.",
//                 status: "resolved",
//                 timestamp: "2025-07-09T07:40:00Z"
//             }
//         ]
//     },
//     {
//         id: 12,
//         orgId: "org_2zS1qQOPMTPdUwxaHVygk2CxgE7",
//         title: "Mobile App Crash",
//         status: "resolved",
//         created_at: "2025-07-10T13:00:00Z",
//         serviceId: 1,
//         updates: [
//             {
//                 message: "Crash reports received from mobile app users.",
//                 status: "investigating",
//                 timestamp: "2025-07-10T13:05:00Z"
//             },
//             {
//                 message: "Bug fix deployed. App is stable now.",
//                 status: "resolved",
//                 timestamp: "2025-07-10T13:30:00Z"
//             }
//         ]
//     },
//     {
//         id: 13,
//         orgId: "org_2zS1qQOPMTPdUwxaHVygk2CxgE7",
//         title: "File Upload Issue",
//         status: "resolved",
//         created_at: "2025-07-11T16:00:00Z",
//         serviceId: 2,
//         updates: [
//             {
//                 message: "Users unable to upload files.",
//                 status: "investigating",
//                 timestamp: "2025-07-11T16:10:00Z"
//             },
//             {
//                 message: "Service restored. File uploads working.",
//                 status: "resolved",
//                 timestamp: "2025-07-11T16:40:00Z"
//             }
//         ]
//     },
//     {
//         id: 14,
//         orgId: "org_2zS1qQOPMTPdUwxaHVygk2CxgE7",
//         title: "Mobile App Performance Issues",
//         status: "investigating",
//         created_at: "2025-07-01T14:00:00Z",
//         serviceId: 4,
//         updates: [
//             {
//                 message: "Users reporting slow app performance.",
//                 status: "investigating",
//                 timestamp: "2025-07-01T14:10:00Z"
//             }
//         ]
//     },
//     {
//         id: 15,
//         orgId: "org_2zS1qQOPMTPdUwxaHVygk2CxgE7",
//         title: "Payment Processing Delays",
//         status: "resolved",
//         created_at: "2025-07-02T16:00:00Z",
//         serviceId: 5,
//         updates: [
//             {
//                 message: "Payment processing is experiencing delays.",
//                 status: "investigating",
//                 timestamp: "2025-07-02T16:10:00Z"
//             },
//             {
//                 message: "Issue resolved. Payments processing normally.",
//                 status: "resolved",
//                 timestamp: "2025-07-02T16:45:00Z"
//             }
//         ]
//     },
//     {
//         id: 16,
//         orgId: "org_2zS1qQOPMTPdUwxaHVygk2CxgE7",
//         title: "Email Delivery Problems",
//         status: "monitoring",
//         created_at: "2025-07-03T10:00:00Z",
//         serviceId: 6,
//         updates: [
//             {
//                 message: "Email delivery is experiencing issues.",
//                 status: "investigating",
//                 timestamp: "2025-07-03T10:10:00Z"
//             },
//             {
//                 message: "Monitoring email delivery performance.",
//                 status: "monitoring",
//                 timestamp: "2025-07-03T10:30:00Z"
//             }
//         ]
//     },
//     // Maintenance incidents
//     {
//         id: 17,
//         orgId: "org_2zS1qQOPMTPdUwxaHVygk2CxgE7",
//         title: "Scheduled Maintenance - Payment Gateway",
//         status: "monitoring",
//         created_at: "2025-07-12T02:00:00Z",
//         serviceId: 5,
//         isMaintenance: true,
//         scheduledStart: "2025-07-12T02:00:00Z",
//         scheduledEnd: "2025-07-12T04:00:00Z",
//         updates: [
//             {
//                 message: "Scheduled maintenance window for Payment Gateway infrastructure updates.",
//                 status: "monitoring",
//                 timestamp: "2025-07-12T02:00:00Z"
//             },
//             {
//                 message: "Maintenance in progress. Service may experience intermittent availability.",
//                 status: "monitoring",
//                 timestamp: "2025-07-12T02:15:00Z"
//             }
//         ]
//     },
//     {
//         id: 18,
//         orgId: "org_2zS1qQOPMTPdUwxaHVygk2CxgE7",
//         title: "Database Maintenance - Performance Optimization",
//         status: "resolved",
//         created_at: "2025-07-10T01:00:00Z",
//         serviceId: 3,
//         isMaintenance: true,
//         scheduledStart: "2025-07-10T01:00:00Z",
//         scheduledEnd: "2025-07-10T03:00:00Z",
//         updates: [
//             {
//                 message: "Scheduled database maintenance for performance optimization.",
//                 status: "monitoring",
//                 timestamp: "2025-07-10T01:00:00Z"
//             },
//             {
//                 message: "Maintenance completed successfully. Database performance improved.",
//                 status: "resolved",
//                 timestamp: "2025-07-10T03:00:00Z"
//             }
//         ]
//     }
// ]; 