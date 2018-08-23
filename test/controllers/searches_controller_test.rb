# coding: utf-8
require 'test_helper'

class SearchesControllerTest < ActionDispatch::IntegrationTest
  describe SearchesController, :citation? do
    it "should match regular and slug citation forms" do
      ctrl = SearchesController.new
      assert ctrl.send(:citation?, "42 F. Supp. 135")
      assert ctrl.send(:citation?, "42-f-supp-135")
      refute ctrl.send(:citation?, "BOYER v. MILLER HATCHERIES, Inc.")
      refute ctrl.send(:citation?, "Not 42 F. Supp. 135")
      refute ctrl.send(:citation?, "42 F. Supp. 135 but not")
    end
  end

  describe SearchesController, :show do
    it "should query capapi for cases when the query string is a citation" do
      cite = cases(:case_with_citation).citations[0]["cite"]
      capapi_url = "https://capapi.org/api/v1/cases/"

      raw_response_file = File.new("#{Rails.root}/test/stubs/capapi.org-api-v1–cases-cite-275-us-303.txt")
      stub_request(:get, capapi_url)
        .with(query: {"cite" => cite})
        .to_return(raw_response_file)

      get "/search", params: {type: "cases", q: cite, partial: true}
      assert_requested :get, capapi_url, query: {"cite" => cite}
    end

    it "should not query capapi for cases when the query string is not a citation" do
      query = "not a cite"
      get "/search", params: {type: "cases", q: query, partial: true}
      assert_not_requested :get, "https://capapi.org/api/v1/cases/", query: {"cite" => query}
    end

    it "should not query capapi for cases when searching outside of the add resources modal" do
      cite = cases(:case_with_citation).citations[0]["cite"]
      get "/search", params: {type: "cases", q: cite}
      assert_not_requested :get, "https://capapi.org/api/v1/cases/", query: {"cite" => cite}
    end
  end
end
