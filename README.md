# Slip Studio

Slip Studio is an Expo app for creating sales slips and invoices from a simple form, then exporting the result as a PDF, Word document, shareable file, or print job.

It supports two output layouts:

- `A4 Invoice` for a full-page invoice
- `80mm Receipt` for a thermal receipt style slip

## What Users Can Do

- Add business logo and header details
- Enter customer and invoice information
- Add one or more line items
- Set discount and tax for each item
- See live totals while typing
- Preview the final slip before exporting
- Download PDF
- Download Word document
- Share PDF
- Print the slip

## Typical Use Case

This app is useful for:

- Shop owners who need a quick invoice for walk-in customers
- Small businesses that want a receipt-style slip for counters or thermal printers
- Teams that want a fast way to generate a printable sales summary

## User Flow

The app is organized into two main screens:

1. Home screen
2. Preview screen

### 1. Home Screen

The home screen is the main input area. It has two cards:

- `Slip Header`
- `Slip Create`

Tap a card to open that section.

#### Slip Header

Use this section to define the business identity shown on the slip:

- Upload a logo from the device gallery
- Set the business title
- Set the business subtitle
- Enter the business address
- Enter the business phone number

#### Slip Create

Use this section to build the actual invoice or receipt:

- Choose the slip size
- Enter invoice number and date
- Enter salesperson name
- Enter customer name and address
- Enter cash received
- Add a remark
- Add line items

Each item includes:

- Item name
- Quantity
- Unit price
- Discount percentage
- Tax percentage

The app calculates line totals and the overall grand total automatically as you type.

### 2. Preview Screen

After filling the form, tap `Preview slip`.

The preview screen shows:

- The final slip layout
- A summary of totals
- The generated file name for PDF
- The generated file name for Word

From this screen you can:

- Download PDF
- Download Word
- Share PDF
- Print slip

## Slip Sizes

### A4 Invoice

Best for standard invoices and detailed records.

Includes:

- Business header
- Customer and invoice details
- Table of items
- Summary totals
- Remark line

### 80mm Receipt

Best for compact receipt printers and simple counter sales.

Includes:

- Business header
- Receipt number
- Item list
- Compact totals
- Thank-you message

## Export Behavior

### PDF

- The app generates a PDF from the preview layout
- On web, the file is downloaded directly
- On Android, the app asks where to save the file
- On iPhone, the file is saved inside the app flow and can be shared out

### Word

- The app generates a Word-compatible document from the same preview content
- The file is saved with a `.doc` extension
- It can be opened in apps like Microsoft Word or WPS Office

### Share PDF

- Opens the device share sheet
- Useful for sending the slip through messaging or email apps

### Print

- Opens the native print dialog
- Best for connected printers or system print workflows

## Validation Rules

The app checks the form before allowing preview.

Required fields include:

- Business title
- Business address
- Business phone
- Customer name
- Invoice number
- Invoice date
- At least one item

If a required field is missing, the app highlights the problem and asks the user to fix it before continuing.

## Important Notes

- The selected logo is shown in the preview and in exported files.
- The invoice date defaults to today when the form opens.
- Cash received and balance are calculated automatically.
- Preview data is stored in memory for the current session. If the app is refreshed or closed before export, the slip should be created again.

## Running Locally

Install dependencies:

```bash
npm install
```

Start the app:

```bash
npm start
```

Other useful scripts:

```bash
npm run android
npm run ios
npm run web
npm run lint
```

## Project Structure

- `app/` - Expo Router screens
- `components/` - Reusable UI pieces
- `lib/` - Slip data, calculations, and export helpers
- `assets/` - Images and app icons
- `scripts/` - Project maintenance scripts

## Quick Walkthrough

1. Open the app.
2. Tap `Slip Header` and enter business details.
3. Tap `Slip Create` and choose a slip size.
4. Fill in customer and invoice details.
5. Add items and adjust quantity, price, discount, or tax.
6. Check the live totals card.
7. Tap `Preview slip`.
8. Download, share, or print the final file.

