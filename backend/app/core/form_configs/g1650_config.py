# backend/app/core/form_configs/g1650_config.py
# G-1650: Authorization for ACH Transactions (single page).
# XFA-style nested field names: applicant vs bank-holder name fields share a last
# segment (GivenName[0]/MiddleName[0]/FamilyName[0]), so PDFFillerService relies on
# EXACT field-name matching for this form (see the exact-match-first logic in
# pdf_filler.py). The PDF417 barcode is auto-generated and intentionally not mapped.
FIELD_MAPPING = {
    # Applicant / Petitioner / Requester name
    "applicant_given": "form1[0].PG1[0].sfApplicantPetitionerName[0].GivenName[0]",
    "applicant_middle": "form1[0].PG1[0].sfApplicantPetitionerName[0].MiddleName[0]",
    "applicant_family": "form1[0].PG1[0].sfApplicantPetitionerName[0].FamilyName[0]",

    # Bank account holder name (as it appears on the account)
    "bank_holder_given": "form1[0].PG1[0].sfBankAccountHolderInfo[0].GivenName[0]",
    "bank_holder_middle": "form1[0].PG1[0].sfBankAccountHolderInfo[0].MiddleName[0]",
    "bank_holder_family": "form1[0].PG1[0].sfBankAccountHolderInfo[0].FamilyName[0]",

    # Account holder type (verified by on-page label x-position):
    #   Business -> CB_AccountType[0] (x=38.8) | Personal -> CB_AccountType[1] (x=134.8)
    "account_holder_business": "form1[0].PG1[0].sfBankAccountHolderInfo[0].CB_AccountType[0]",
    "account_holder_personal": "form1[0].PG1[0].sfBankAccountHolderInfo[0].CB_AccountType[1]",

    # Account type -- USCIS named these CB_CreditCardType but the on-page labels are
    # Checking/Savings:  Checking -> [1] (x=38.8) | Savings -> [0] (x=134.8)
    "account_type_checking": "form1[0].PG1[0].sfBankAccountInformation[0].CB_CreditCardType[1]",
    "account_type_savings": "form1[0].PG1[0].sfBankAccountInformation[0].CB_CreditCardType[0]",

    # Bank account information
    "bank_name": "form1[0].PG1[0].sfBankAccountInformation[0].BankName[0]",
    "routing_number": "form1[0].PG1[0].sfBankAccountInformation[0].RoutingNumber[0]",
    "account_number": "form1[0].PG1[0].sfBankAccountInformation[0].AccountNumber[0]",
    "business_name": "form1[0].PG1[0].sfBankAccountInformation[0].BusinessName[0]",
    "authorized_payment_amount": "form1[0].PG1[0].sfBankAccountInformation[0].AuthorizedPaymentAmt[0]",

    # Authorization
    "applicant_signature": "form1[0].PG1[0].AuthorizationandSignature[0].SignatureOfApplicant[0]",
}
