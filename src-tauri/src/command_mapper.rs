macro_rules! tauri_commands {
    (
        $state_type:ty,
    $($action:ident :: $method:ident($($param:ident: $param_type:ty),*) -> $ret:ty),*) => {
        $(
            paste! {
                #[tauri::command(rename_all="snake_case")]
                pub async fn [<$action _ $method>]<'r>(
                    state: State<'r, $state_type>,
                    $($param: $param_type),*
                ) -> $ret {
                    state.$action
                        .$method($($param),*)
                        .await
                        .map_err(|e| e)
                }
            }
        )*
    };
}
