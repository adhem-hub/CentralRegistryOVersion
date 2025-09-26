//companymodal.ts
export interface Company {
  id: string;
  name: string;
  headquarters: string;
  phone_number: number;
  branch_locations: string;
  directors: {
    role: string;
    email: string;
    phone_number: number;
    signature: string;
    first_name: string;
    last_name: string;
    salutation: string;
    number_of_employees: number;
   

  }[];
  legal_information: {
    legal_forms: string;
    legal_status: string;
    sector: string;
  };
  financial_information: {
    company_capital: string;
  };
  activity: {
    details: string;
    project_name: string;
    location: string;
  };
  financial_report?: string;
  unique_identifier: string;
  company_profile: string;
  company_purpose: string;
  zip_code: string;
  location: string;
  country: string;
  languages: string[];
  logo?:string;

}

