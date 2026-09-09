# backend/app/core/form_configs/g1450_config.py
# G-1450: Authorization for Credit Card Transactions (single page, 29 widgets).
# Maps frontend keys -> PDF AcroForm field paths. Adjust keys as needed to match
# the autofill mapper (lib/autoFill/mapper.ts).
FIELD_MAPPING = {
    # Applicant name (person the payment is for)
    "family_name": "form1[0].#subform[0].FamilyName[0]",
    "given_name": "form1[0].#subform[0].GivenName[0]",
    "middle_name": "form1[0].#subform[0].MiddleName[0]",

    # Credit card holder name
    "cc_holder_family_name": "form1[0].#subform[0].CCHolderFamilyName[0]",
    "cc_holder_given_name": "form1[0].#subform[0].CCHolderGivenName[0]",
    "cc_holder_middle_name": "form1[0].#subform[0].CCHolderMiddleName[0]",

    # Card holder billing address
    "cc_holder_street": "form1[0].#subform[0].Pt1Line2b_StreetNumberName[0]",
    # Unit-type checkboxes (verified by on-page label x-position, not widget index):
    #   Apt. -> Unit[1] (x=412) | Ste. -> Unit[0] (x=430) | Flr. -> Unit[2] (x=448)
    "cc_holder_unit_apt": "form1[0].#subform[0].CCHolderAptSteFlr_Unit[1]",
    "cc_holder_unit_ste": "form1[0].#subform[0].CCHolderAptSteFlr_Unit[0]",
    "cc_holder_unit_flr": "form1[0].#subform[0].CCHolderAptSteFlr_Unit[2]",
    "cc_holder_unit_number": "form1[0].#subform[0].CCHolderAptSteFlrNumber[0]",
    "cc_holder_city": "form1[0].#subform[0].CityOrTown[0]",
    "cc_holder_state": "form1[0].#subform[0].State[0]",
    "cc_holder_zip": "form1[0].#subform[0].ZipCode[0]",
    "cc_holder_phone": "form1[0].#subform[0].DaytimeTelephoneNumber[0]",
    "cc_holder_email": "form1[0].#subform[0].Email[0]",

    # Card type checkboxes (Visa / MasterCard / American Express / Discover)
    "cc_type_visa": "form1[0].#subform[0].CreditCardTypeChBx[0]",
    "cc_type_mastercard": "form1[0].#subform[0].CreditCardTypeChBx[1]",
    "cc_type_amex": "form1[0].#subform[0].CreditCardTypeChBx[2]",
    "cc_type_discover": "form1[0].#subform[0].CreditCardTypeChBx[3]",

    # Card number in four 4-digit segments (segment 4 has a duplicate widget)
    "cc_number_1": "form1[0].#subform[0].CreditCardNumber_1[0]",
    "cc_number_2": "form1[0].#subform[0].CreditCardNumber_2[0]",
    "cc_number_3": "form1[0].#subform[0].CreditCardNumber_3[0]",
    "cc_number_4": "form1[0].#subform[0].CreditCardNumber_4[0]",

    # CVV: USCIS named this widget CreditCardNumber_4[1], but it sits under the
    # "CVV Code" label (x=162) on the page, NOT the card-number row.
    "cc_cvv": "form1[0].#subform[0].CreditCardNumber_4[1]",

    # Expiration, signature, amount
    "cc_expiration_date": "form1[0].#subform[0].ExpirationDate[0]",
    "applicant_signature": "form1[0].#subform[0].SignatureOfApplicant[0]",
    "authorized_payment_amount": "form1[0].#subform[0].AuthorizedPaymentAmt[0]",
}
