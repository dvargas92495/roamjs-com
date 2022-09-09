import { Label } from "@blueprintjs/core";
import React, { useState } from "react";
import MenuItemSelect from "roamjs-components/components/MenuItemSelect";
import getFullTreeByParentUid from "roamjs-components/queries/getFullTreeByParentUid";
import getPageUidByPageTitle from "roamjs-components/queries/getPageUidByPageTitle";
import toFlexRegex from "roamjs-components/util/toFlexRegex";

export const useOauthAccounts = (id:string): {
  accountDropdown: React.ReactElement;
  accountLabel: string;
} => {
  const accountLabels = (
    getFullTreeByParentUid(getPageUidByPageTitle(`roam/js/${id}`)).children.find((t) =>
      toFlexRegex("oauth").test(t.text)
    )?.children || []
  )
    .map((t) => t.text)
    .filter((t) => !t.startsWith("{") && !t.endsWith("}"));
  const [accountLabel, setAccountLabel] = useState(accountLabels[0] || "");
  const accountDropdown = (
    <>
      {accountLabels.length > 1 && (
        <Label>
          Account:
          <MenuItemSelect
            activeItem={accountLabel}
            onItemSelect={(i) => setAccountLabel(i)}
            items={accountLabels}
          />
        </Label>
      )}
    </>
  );
  return {
    accountDropdown,
    accountLabel,
  };
};
