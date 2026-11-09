export const TEMPLATES = {
    flight_booking: {
        title: 'Flight Booking & Cabin Selection',
        description: 'Airline ticket selector with live cabin tiers, add-ons toggle, and price computation.',
        mdui: `@cabin("economy")
@passengers(2)
@loungeAccess(false)
@seatSelection(true)

::: hero
# ✈️ Flight SFO → HND
**Non-stop flight to Tokyo Haneda** · Departs 11:30 AM · Boeing 787-9
:::

??? cabin
typeOf: segmented
options: ["economy", "premium", "business", "first"]
label: Select Cabin Class
???

::: card if: @cabin == "economy"
### Economy Main Cabin
Standard seating with complimentary meals and inflight entertainment.
* Seat Pitch: 32"
* Carry-on included
* Total per traveler: **$850**
:::

::: card if: @cabin == "premium"
### Premium Economy
Extra legroom, priority boarding, and premium dining.
* Seat Pitch: 38"
* 2 Checked bags (23kg each)
* Haneda priority security lane
* Total per traveler: **$1,450**
:::

::: card if: @cabin == "business"
### Business Class Suite
Lie-flat seat with sliding privacy door and sommelier service.
* Seat Pitch: 78" (Full Flat Bed)
* SFO Polaris lounge access included
* 2 Checked bags (32kg each)
* Total per traveler: **$3,200**
:::

::: card if: @cabin == "first"
### First Class Sanctuary
Private enclosed bedroom suite with Krug champagne and caviar.
* 43" 4K IFE monitor
* Private VIP escort & apron transfer
* Total per traveler: **$5,800**
:::

::: card
### Add-ons & Passenger Count

??? passengers
typeOf: slider
min: 1
max: 6
step: 1
label: Number of Passengers
???

::: row
??? loungeAccess
typeOf: toggle
label: Priority Lounge Access ($95 / person)
???

??? seatSelection
typeOf: toggle
label: Advance Window/Aisle Seat Selection ($35)
???
:::

:::

[Confirm Itinerary & Proceed](action:confirm_booking){primary} [Change Dates](action:change_dates){secondary}`
    },
    dashboard: {
        title: 'Executive Telemetry & SLA Dashboard',
        description: 'System health indicators, response time metrics, and cluster latency chart.',
        mdui: `@env("production")
@region("us-east-1")

::: hero
# ⚡ CloudPulse Global Infrastructure
Real-time fleet health across 18 regional availability zones.
:::

??? region
typeOf: segmented
options: ["us-east-1", "eu-west-1", "ap-northeast-1"]
label: Active Edge Region
???

::: grid
::: card
### Overall Health
## 99.992% {.success}
*(P99 SLA: Met)*
:::

::: card
### API Ingestion
## 1.42 M req/s {.primary}
*(+8.4% vs baseline)*
:::

::: card
### Median Latency
## 18.4 ms {.success}
*(-2.1 ms improvement)*
:::

::: card
### Error Rate
## 0.003% {.success}
*(5xx below 0.01% threshold)*
:::
:::

::: barChart
| Service Tier | P50 (ms) | P99 (ms) |
| :--- | :--- | :--- |
| Auth Gateway | 4.2 | 12.8 |
| GraphQL Mesh | 11.5 | 32.1 |
| Vector Index | 8.9 | 24.3 |
| SQL Replica | 6.1 | 18.7 |
:::

[Trigger Failover Drill](action:failover){secondary} [Export Telemetry JSON](action:export_telemetry){primary}`
    },
    checkout: {
        title: 'Retail Shopping Bag & Checkout Flow',
        description: 'Multi-step e-commerce checkout with quantity selectors and dynamic discount coupon.',
        mdui: `@shipping("ground")
@couponCode("")
@giftWrap(false)

::: hero
# 🛍️ Express Retail Checkout
Review your cart items and complete payment securely.
:::

::: card
### Order Items

| Item | Qty | Unit Price | Total |
| :--- | :--- | :--- | :--- |
| **Studio Wireless Headphones** | 1 | $199.00 | $199.00 |
| **Braided USB-C Cable (2m)** | 2 | $19.00 | $38.00 |
| **Matte MagSafe Phone Case** | 1 | $49.00 | $49.00 |

::: row
::: card
Subtotal: **$286.00**
Estimated Tax: **$23.60**
:::
::: card
Shipping: **Free Ground**
Estimated Delivery: **3-5 Business Days**
:::
:::
:::

??? shipping
typeOf: segmented
options: ["ground", "express", "overnight"]
label: Shipping Delivery Speed
???

::: row
??? giftWrap
typeOf: toggle
label: Add Premium Gift Packaging ($7.50)
???

??? couponCode
typeOf: text
placeholder: Promo Code (e.g. SAVE20)
label: Promotional Discount
???
:::

[Authorize Apple Pay ($309.60)](action:pay_applepay){primary} [Pay with Credit Card](action:pay_card){secondary}`
    },
    charts: {
        title: 'Visual Data Analytics & Charts',
        description: 'Showcase of SVG Bar, Line, and Donut charts driven by markdown pipe tables.',
        mdui: `@channel("all")

# 📊 Performance Metrics & Revenue Analytics

::: barChart
| Channel | Q1 Revenue | Q2 Revenue |
| :--- | :--- | :--- |
| Organic Search | 142000 | 188000 |
| Direct Traffic | 98000 | 115000 |
| Partner Referrals | 62000 | 89000 |
| Social Campaigns | 44000 | 72000 |
:::

::: lineChart
| Month | Active Users | Paid Subscribers |
| :--- | :--- | :--- |
| Jan | 12000 | 1400 |
| Feb | 14500 | 1750 |
| Mar | 18200 | 2300 |
| Apr | 22400 | 3100 |
| May | 28900 | 4250 |
| Jun | 36500 | 5800 |
:::

::: pieChart
| Plan Tier | Accounts |
| :--- | :--- |
| Free Starter | 5400 |
| Pro Developer | 2800 |
| Team Workspace | 1200 |
| Enterprise Custom | 450 |
:::

[Download CSV Reports](action:download_csv){secondary} [Refresh Analytics Feed](action:refresh){primary}`
    },
    booking_wizard: {
        title: 'Progressive Intake Booking Wizard',
        description: 'Three-stage intake wizard (criteria intake -> option selection -> confirmation) without pre-fabricated assumptions.',
        mdui: `@step("intake")
@specialty("Primary Care")
@visitType("In-Person")
@provider("Dr. Sarah Jenkins, MD")
@timeSlot("Tomorrow at 10:00 AM")
@patientName("")

::: hero
# 🩺 HealthConnect Appointment Scheduling
Secure provider scheduling and intake assistant.
:::

::: card if: @step == "intake"
### Step 1 of 3: Consultation Details
Please specify your consultation requirements to view matching providers.

??? specialty
typeOf: segmented
options: ["Primary Care", "Cardiology", "Dermatology", "Pediatrics"]
label: Care Specialty
???

??? visitType
typeOf: segmented
options: ["In-Person", "Telehealth Video"]
label: Consultation Type
???

??? patientName
typeOf: text
required: true
placeholder: Enter Full Legal Name
label: Patient Name *(Required)*
???

[Find Available Providers](action:submit; action:set:step="selection"){primary}
:::

::: card if: @step == "selection"
### Step 2 of 3: Choose Provider & Time Slot
Select an available doctor and appointment time for **{{ specialty }}** ({{ visitType }}).

??? provider
typeOf: segmented
style: menu
options: ["Dr. Sarah Jenkins, MD (Family Medicine)", "Dr. Marcus Patel, MD (Internal Medicine)", "Dr. Emily Chen, DO (Preventive Care)"]
label: Healthcare Provider
???

::: row
??? appointmentDate
typeOf: segmented
options: ["Tomorrow", "Wednesday", "Thursday"]
label: Date
???

??? timeSlot
typeOf: segmented
options: ["10:00 AM", "2:30 PM", "4:15 PM"]
label: Time
???
:::

[← Back to Details](action:set:step="intake"){secondary} = [Confirm Appointment](action:set:step="confirmed"){primary}
:::

::: card if: @step == "confirmed"
### 🎉 Appointment Confirmed!
Your consultation has been reserved in the clinic calendar.

* **Patient**: {{ patientName | "Registered Patient" }}
* **Specialty**: {{ specialty }}
* **Provider**: **{{ provider }}**
* **Time**: **{{ timeSlot }}**
* **Format**: {{ visitType }}
* **Confirmation Code**: \`HC-8942-TX\`

::: row
[Add to Calendar](action:add_calendar){primary}
[Modify Appointment](action:set:step="intake"){secondary}
:::
:::`
    }
};
