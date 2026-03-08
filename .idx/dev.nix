{ pkgs, ... }: {
  channel = "stable-24.05";
  packages = [ pkgs.python311 ];
  idx = {
    extensions = [];
    previews = {
      enable = true;
      previews = {
        web = {
          command = ["python3" "-m" "http.server" "$PORT"];
          manager = "web";
        };
      };
    };
  };
}