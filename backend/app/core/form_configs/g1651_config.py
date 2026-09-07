# backend/app/core/form_configs/g1651_config.py
# G-1651: Exemption for Paper Fee Payment (single page).
# Only two fillable widgets exist (the PDF417 barcode is auto-generated and not mapped).
# Maps frontend keys -> PDF AcroForm field paths.
FIELD_MAPPING = {
    "payer_signature": "form1[0].#subform[0].Signature[0]",
    "payer_date": "form1[0].#subform[0].Date[0]",
}
